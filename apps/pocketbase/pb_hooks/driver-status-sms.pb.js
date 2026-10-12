/// <reference path="../pb_data/types.d.ts" />

// Automated Customer Notification Hook when Driver updates status to
// "on_the_way" ("accepted") or "arrived".
//
// - Status "on_the_way" / "accepted" -> "Your driver is on the way."
// - Status "arrived" -> "Your driver has arrived."
//
// IMPORTANT: PocketBase runs each hook callback in an isolated JSVM scope,
// so all helpers are defined inside the callback and wrapped in try/catch.

onRecordAfterUpdateSuccess((e) => {
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function cleanDigits(phone) {
    var d = String(phone || "").replace(/[^\d]/g, "");
    if (d.length === 11 && d.charAt(0) === "1") {
      return d.slice(1);
    }
    return d;
  }

  try {
    const r = e.record;
    const orig = e.record.original ? e.record.original() : null;

    const newStatus = String(r.get("driverStatus") || "").trim();
    const oldStatus = orig ? String(orig.get("driverStatus") || "").trim() : "";

    // Only trigger when driverStatus actually transitions to on_the_way/accepted or arrived
    if (!newStatus || newStatus === oldStatus) {
      return;
    }

    let smsMessage = "";
    let statusHeading = "";
    let badgeColor = "#2563eb";

    if (newStatus === "on_the_way" || newStatus === "accepted") {
      smsMessage = "Your driver is on the way.";
      statusHeading = "DRIVER ON THE WAY";
      badgeColor = "#2563eb";
    } else if (newStatus === "arrived") {
      smsMessage = "Your driver has arrived.";
      statusHeading = "DRIVER HAS ARRIVED";
      badgeColor = "#16a34a";
    } else {
      return;
    }

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
    } catch (_) {}

    const businessName = (settings && settings.get("businessName")) || r.get("sourceName") || "Elite Limo Link";
    const senderName = (settings && settings.get("dispatchName")) || businessName || "Elite Limo Link";

    const customerEmail = String(r.get("email") || "").trim();
    const customerPhone = String(r.get("phone") || "").trim();
    const passengerName = String(r.get("name") || "Valued Passenger").trim();
    const pickupAddr = String(r.get("pickup") || "").trim();
    const ref = "RB-" + String(r.id).slice(-8).toUpperCase();

    // 1. Send automated notification to customer email if present
    if (customerEmail) {
      const html =
        '<div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #dce5f4;border-radius:14px;overflow:hidden">' +
        '<div style="background:' + badgeColor + ';color:#fff;padding:20px 22px">' +
        '<div style="font-size:11px;letter-spacing:.15em;font-weight:700;opacity:.9">' + esc(statusHeading) + '</div>' +
        '<div style="font-size:13px;font-weight:700;margin-top:5px;opacity:.9">' + esc(businessName) + '</div>' +
        '<div style="font-size:22px;font-weight:800;margin-top:6px">' + esc(smsMessage) + '</div>' +
        '</div>' +
        '<div style="padding:20px 22px;color:#202b41;font-size:14px;line-height:1.6">' +
        '<p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a">' + esc(smsMessage) + '</p>' +
        '<p style="margin:0 0 14px">Hello ' + esc(passengerName) + ', your chauffeur from <strong>' + esc(businessName) + '</strong> has updated your ride status:</p>' +
        (pickupAddr ? '<div style="padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:14px"><strong>Pickup Location:</strong> ' + esc(pickupAddr) + '</div>' : '') +
        '<p style="margin:0;color:#7d899c;font-size:12px">Reference ' + esc(ref) + ' · Automated Chauffeur SMS Notification</p>' +
        '</div></div>';

      try {
        const msg = new MailerMessage({
          from: { name: senderName },
          to: [{ address: customerEmail }],
          subject: smsMessage + " — " + businessName + " (" + ref + ")",
          text: smsMessage + " (" + businessName + " - Pickup: " + pickupAddr + ")",
          html: html,
        });
        $app.newMailClient().send(msg);
      } catch (err) {
        $app.logger().error("driver-status-sms: customer email failed", "err", String(err));
      }
    }

    // 2. Carrier Email-to-SMS Gateway delivery for 10-digit US mobile numbers
    const digits = cleanDigits(customerPhone);
    if (digits.length === 10) {
      const smsGateways = [
        digits + "@txt.att.net",
        digits + "@vtext.com",
        digits + "@tmomail.net",
      ];
      for (var i = 0; i < smsGateways.length; i++) {
        try {
          const smsMail = new MailerMessage({
            from: { name: senderName },
            to: [{ address: smsGateways[i] }],
            subject: "",
            text: smsMessage,
          });
          $app.newMailClient().send(smsMail);
        } catch (_) {}
      }
    }
  } catch (err) {
    $app.logger().error("driver-status-sms hook error", "err", String(err));
  }
}, "reservations");
