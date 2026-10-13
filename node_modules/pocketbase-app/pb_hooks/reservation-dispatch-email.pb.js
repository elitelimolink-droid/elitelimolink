/// <reference path="../pb_data/types.d.ts" />

// Sends a detailed reservation notification to the dispatch/driver address
// right after a booking is created, and (optionally) a confirmation to the
// customer. The recipient address and sender name come from the `settings`
// collection, so the operator can change them at any time from the dashboard
// without touching code.
//
// IMPORTANT: PocketBase runs each hook callback in an isolated JSVM scope, so
// every helper must be defined INSIDE the callback — file-level bindings are
// undefined there. The whole body is wrapped so a mailer/settings failure can
// never abort the reservation write.

onRecordAfterCreateSuccess((e) => {
  function fmtDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var h = d.getHours();
    var ampm = h >= 12 ? "PM" : "AM";
    var h12 = h % 12 || 12;
    var m = d.getMinutes();
    return days[d.getDay()] + ", " + months[d.getMonth()] + " " + d.getDate() + ", " + h12 + ":" + (m < 10 ? "0" + m : m) + " " + ampm;
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  try {
    const r = e.record;

    // Multi-business: resolve the settings of the operator who owns this
    // reservation, so notifications use that business's dispatch email,
    // sender name, and customer-email preference. Falls back to the primary
    // (oldest) settings row for legacy reservations without an owner.
    const ownerId = r.get("owner") || "";
    let settings = null;
    try {
      if (ownerId) {
        const rows = $app.findRecordsByFilter("settings", "owner = {:owner}", "-created", 1, 0, { owner: ownerId });
        if (rows && rows.length > 0) settings = rows[0];
      }
      if (!settings) {
        const rows = $app.findRecordsByFilter("settings", "id != ''", "created", 1, 0);
        if (rows && rows.length > 0) settings = rows[0];
      }
    } catch (err) {
      $app.logger().error("dispatch email: settings load failed", "err", String(err));
    }

    const businessName = (settings && settings.get("businessName")) || "";
    const senderName =
      (settings && settings.get("dispatchName")) ||
      businessName ||
      "RideBits Reservations";
    const dispatchEmail = settings ? settings.get("dispatchEmail") : "";

    // Central operator notification: every new reservation is emailed to the
    // central operator (Limobjk@gmail.com) regardless of the owning business's
    // dispatchEmail setting, so the central control panel always sees incoming
    // bookings and which business location they came from. The business name
    // is included in the subject, header, and detail table below.
    const CENTRAL_NOTIFY_EMAIL = "Limobjk@gmail.com";

    const service = r.get("service") === "hourly" ? "Hourly chauffeur" : "Point-to-point ride";
    let vehicleMap = { sedan: "Executive sedan", suv: "Premium SUV", van: "Passenger van" };
    try {
      var tierRows = ownerId
        ? $app.findRecordsByFilter("vehicle_tiers", "owner = {:owner}", "sort", 100, 0, { owner: ownerId })
        : $app.findRecordsByFilter("vehicle_tiers", "id != ''", "sort", 100, 0);
      if (tierRows && tierRows.length > 0) {
        var map = {};
        for (var i = 0; i < tierRows.length; i++) {
          var tr = tierRows[i];
          map[tr.get("key")] = tr.get("name");
        }
        vehicleMap = map;
      }
    } catch (err) {
      $app.logger().error("dispatch email: vehicle_tiers load failed", "err", String(err));
    }
    const vehicle = vehicleMap[r.get("vehicle")] || r.get("vehicle");
    const pickupLocal = r.get("pickupLocal") || fmtDate(r.get("pickupAt"));
    const returnLocal = r.get("returnLocal") || (r.get("returnAt") ? fmtDate(r.get("returnAt")) : "");
    const fareText = r.get("estimatedFareText") || (r.get("estimatedFare") ? "$" + r.get("estimatedFare") : "To be quoted");
    const miles = r.get("distanceMiles");
    const ref = "RB-" + String(r.id).slice(-8).toUpperCase();

    // --- Dispatch / driver notification ---
    // Always sent to the central operator (Limobjk@gmail.com) so the central
    // control panel is notified of every new reservation and which business
    // location it originated from. When the owning business has its own
    // dispatchEmail configured, that address is added as an additional
    // recipient so the local dispatch team is also notified.
    const notifyRecipients = [{ address: CENTRAL_NOTIFY_EMAIL }];
    if (dispatchEmail && dispatchEmail.toLowerCase() !== CENTRAL_NOTIFY_EMAIL.toLowerCase()) {
      notifyRecipients.push({ address: dispatchEmail });
    }

    {
      const rows = [
        ["Business", esc(businessName || "Main booking page")],
        ["Passenger", esc(r.get("name"))],
        ["Service", esc(service)],
        ["Pickup", esc(r.get("pickup"))],
        ["Extra stop", esc(r.get("extraStop") || "—")],
        ["Dropoff", esc(r.get("dropoff") || "—")],
        ["Pickup time", esc(pickupLocal)],
        ["Return", esc(returnLocal || "—")],
        ["Duration", r.get("service") === "hourly" ? esc(r.get("hours") + " hours") : "—"],
        ["Vehicle", esc(vehicle)],
        ["Passengers", esc(r.get("passengers"))],
        ["Car seat", r.get("carSeat") ? "Yes — extra charge" : "—"],
        ["Inside pickup", r.get("insidePickup") ? "Yes — extra charge" : "—"],
        ["Distance", miles ? esc(Number(miles).toFixed(1) + " miles") : "—"],
        ["Est. fare", esc(fareText)],
        ["Flight", esc(r.get("flight") || "—")],
        ["Phone", esc(r.get("phone"))],
        ["Email", esc(r.get("email"))],
        ["Notes", esc(r.get("notes") || "—")],
      ];
      const table = rows
        .map(function (row) {
          return '<tr><td style="padding:6px 12px;color:#5c687b;font-size:12px;white-space:nowrap">' + row[0] + '</td><td style="padding:6px 12px;font-size:12px;font-weight:600;color:#202b41">' + row[1] + "</td></tr>";
        })
        .join("");

      const html =
        '<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #dce5f4;border-radius:14px;overflow:hidden">' +
        '<div style="background:#1f2c46;color:#fff;padding:18px 22px"><div style="font-size:11px;letter-spacing:.15em;font-weight:700;opacity:.8">NEW RESERVATION REQUEST</div><div style="font-size:14px;font-weight:800;margin-top:6px;opacity:.95">' + esc(businessName || "Main booking page") + '</div><div style="font-size:18px;font-weight:800;margin-top:4px">' + esc(r.get("name")) + " — " + esc(service) + "</div></div>" +
        '<div style="padding:18px 22px"><table style="border-collapse:collapse;width:100%">' + table + "</table></div>" +
        '<div style="padding:12px 22px 20px;color:#7d899c;font-size:11px">Reference ' + esc(ref) + " · Sent automatically from your RideBits reservations dashboard.</div></div>";

      try {
        const message = new MailerMessage({
          from: { name: senderName },
          to: notifyRecipients,
          subject: "New reservation request — " + (businessName ? businessName + " · " : "") + r.get("name"),
          html: html,
        });
        $app.newMailClient().send(message);
      } catch (err) {
        $app.logger().error("dispatch email send failed", "to", notifyRecipients.map(function (rcp) { return rcp.address; }).join(","), "err", String(err));
      }
    }

    // --- Customer confirmation (optional) ---
    // Sent only when the operator has enabled customer confirmations in the
    // dashboard. Customer-facing prices are intentionally omitted — the final
    // fare is confirmed by dispatch before pickup. The whole block is wrapped
    // so a mailer/settings failure can never abort the reservation write.
    const customerEnabled = settings ? !!settings.get("customerEmailEnabled") : false;
    const customerEmail = r.get("email");
    if (customerEnabled && customerEmail) {
      const firstName = String(r.get("name") || "").split(" ")[0] || "there";
      const statusRaw = r.get("status") || "pending";
      const statusLabel = statusRaw === "confirmed" ? "Confirmed" : statusRaw === "completed" ? "Completed" : statusRaw === "cancelled" ? "Cancelled" : "Pending review";
      const note = r.get("notes");

      const detailRows = [
        ["Service", esc(service)],
        ["Pickup", esc(r.get("pickup"))],
        (r.get("extraStop") ? ["Extra stop", esc(r.get("extraStop"))] : null),
        (r.get("dropoff") ? ["Dropoff", esc(r.get("dropoff"))] : null),
        ["Pickup time", esc(pickupLocal)],
        (returnLocal ? ["Return", esc(returnLocal)] : null),
        (r.get("service") === "hourly" ? ["Duration", esc(r.get("hours") + " hours")] : null),
        ["Vehicle", esc(vehicle)],
        ["Passengers", esc(r.get("passengers"))],
        (r.get("carSeat") ? ["Car seat", "Requested — extra charge"] : null),
        (r.get("insidePickup") ? ["Inside pickup", "Requested — extra charge"] : null),
        (r.get("flight") ? ["Flight", esc(r.get("flight"))] : null),
        ["Status", esc(statusLabel)],
      ].filter(function (row) { return row !== null; });

      const detailTable = detailRows
        .map(function (row) {
          return '<tr><td style="padding:5px 0;color:#5c687b">' + row[0] + '</td><td style="padding:5px 0;font-weight:600;text-align:right">' + row[1] + "</td></tr>";
        })
        .join("");

      const noteBlock = note
        ? '<div style="margin:0 0 14px;padding:12px 14px;background:#f3f7fe;border:1px solid #e3ecfb;border-radius:10px"><div style="font-size:11px;font-weight:700;letter-spacing:.1em;color:#255dc4;margin-bottom:4px">YOUR NOTE</div><p style="margin:0;font-size:13px;line-height:1.6;color:#202b41;white-space:pre-wrap">' + esc(note) + "</p></div>"
        : "";

      const html =
        '<div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #dce5f4;border-radius:14px;overflow:hidden">' +
        '<div style="background:#255dc4;color:#fff;padding:20px 22px"><div style="font-size:11px;letter-spacing:.15em;font-weight:700;opacity:.9">REQUEST RECEIVED</div><div style="font-size:13px;font-weight:700;margin-top:5px;opacity:.9">' + esc(businessName || senderName) + '</div><div style="font-size:20px;font-weight:800;margin-top:4px">You\'re on your way, ' + esc(firstName) + ".</div></div>" +
        '<div style="padding:20px 22px;color:#202b41;font-size:14px;line-height:1.6"><p style="margin:0 0 14px">Thanks for choosing ' + esc(businessName || senderName) + ". Your reservation request is in and we\'re reviewing availability now.</p>" +
        '<table style="border-collapse:collapse;width:100%;font-size:13px;margin-bottom:14px">' + detailTable + "</table>" +
        noteBlock +
        '<p style="margin:0;color:#7d899c;font-size:12px">Reference ' + esc(ref) + " · Status: " + esc(statusLabel) + ". Your ride is not confirmed until we follow up. We\'ll reach out shortly at this email address.</p></div></div>";

      try {
        const message = new MailerMessage({
          from: { name: senderName },
          to: [{ address: customerEmail }],
          subject: "We received your reservation request — " + esc(ref) + (businessName ? " · " + esc(businessName) : ""),
          html: html,
        });
        $app.newMailClient().send(message);
      } catch (err) {
        $app.logger().error("customer email send failed", "to", customerEmail, "err", String(err));
      }
    } else if (!customerEnabled) {
      $app.logger().info("customer confirmation email skipped: customerEmailEnabled is off in settings");
    } else {
      $app.logger().info("customer confirmation email skipped: no customer email on reservation");
    }
  } catch (err) {
    $app.logger().error("reservation-dispatch-email hook failed", "err", String(err));
  }

  e.next();
}, "reservations");
