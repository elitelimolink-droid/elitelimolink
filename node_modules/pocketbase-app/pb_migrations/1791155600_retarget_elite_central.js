/// <reference path="../pb_data/types.d.ts" />

// Re-target the central reservation dashboard to the Elite Limo control
// panel (BJK Limo Ride Book).
//
// The earlier migration (1791078000) designated the "Alpine" operator as the
// central destination. The operator now wants ALL bookings from every
// business location (Alpine Airport Car Service, Airport Car Service, Elite
// Limo, etc.) directed to and managed through the Elite Limo control panel
// instead.
//
// This delta:
//   - Re-scans settings for the same matched businesses.
//   - Designates the operator whose businessName contains "elite" as the
//     central operator (falling back to the oldest matched if none match).
//   - Force-sets every OTHER matched operator's `managedBy` to the Elite
//     operator (overwriting any prior link, e.g. the old Alpine link), and
//     clears the Elite operator's own `managedBy` so it is no longer managed
//     by anyone (it is now the central hub).
//   - Re-stamps `centralOperator` on every reservation owned by a non-Elite
//     matched operator to the Elite operator id (overwriting prior stamps),
//     so the Elite dashboard sees all historical reservations too. The
//     Elite operator's own reservations need no stamp (owner rule grants
//     access).
//
// The reservation-central-operator hook continues to stamp new reservations
// from each owner's `managedBy`, so future bookings route to Elite
// automatically. Settings, vehicle tiers, source names, and per-business
// access boundaries are unchanged.
migrate(
  (app) => {
    var patterns = ["alpine", "elite", "airport car service"];
    var matched = []; // { ownerId, businessName }
    try {
      var rows = app.findRecordsByFilter("settings", "id != ''", "created", 500, 0);
      for (var i = 0; i < rows.length; i++) {
        var s = rows[i];
        var name = String(s.get("businessName") || "").toLowerCase();
        var ownerVal = s.get("owner");
        var ownerId = "";
        if (Array.isArray(ownerVal)) ownerId = ownerVal[0] || "";
        else if (ownerVal) ownerId = String(ownerVal);
        if (!ownerId) continue;

        var hit = false;
        for (var p = 0; p < patterns.length; p++) {
          if (name.indexOf(patterns[p]) !== -1) {
            hit = true;
            break;
          }
        }
        if (!hit) continue;

        var exists = false;
        for (var m = 0; m < matched.length; m++) {
          if (matched[m].ownerId === ownerId) {
            exists = true;
            break;
          }
        }
        if (!exists) {
          matched.push({ ownerId: ownerId, businessName: s.get("businessName") || "" });
        }
      }
    } catch (err) {
      app.logger().error("elite central: settings scan failed", "err", String(err));
    }

    if (matched.length < 2) {
      try {
        app.logger().info(
          "elite central: fewer than 2 matched businesses found; no re-routing applied",
          "matched",
          matched.length,
        );
      } catch (_) {}
      return;
    }

    // Designate the central operator: prefer the one whose name contains
    // "elite"; otherwise the oldest matched (first in created-asc order).
    var central = null;
    for (var c = 0; c < matched.length; c++) {
      if (/elite/i.test(matched[c].businessName)) {
        central = matched[c];
        break;
      }
    }
    if (!central) central = matched[0];

    // Clear the central operator's own managedBy (it is now the hub, not
    // managed by anyone), then force-link every other matched operator to it.
    try {
      var centralOp = app.findRecordById("users", central.ownerId);
      if (centralOp) {
        centralOp.set("managedBy", "");
        app.save(centralOp);
      }
    } catch (err) {
      app.logger().error(
        "elite central: clear central managedBy failed",
        "owner",
        central.ownerId,
        "err",
        String(err),
      );
    }

    for (var j = 0; j < matched.length; j++) {
      if (matched[j].ownerId === central.ownerId) continue;
      try {
        var op = app.findRecordById("users", matched[j].ownerId);
        if (op) {
          op.set("managedBy", central.ownerId);
          app.save(op);
        }
      } catch (err) {
        app.logger().error(
          "elite central: set managedBy failed",
          "owner",
          matched[j].ownerId,
          "err",
          String(err),
        );
      }
    }

    // Re-stamp centralOperator on every reservation owned by a non-central
    // matched operator (overwriting prior stamps, e.g. the old Alpine stamp).
    for (var k = 0; k < matched.length; k++) {
      if (matched[k].ownerId === central.ownerId) continue;
      try {
        var rrows = app.findRecordsByFilter(
          "reservations",
          "owner = {:owner}",
          "-created",
          1000,
          0,
          { owner: matched[k].ownerId },
        );
        for (var r = 0; r < rrows.length; r++) {
          var rec = rrows[r];
          rec.set("centralOperator", central.ownerId);
          app.save(rec);
        }
      } catch (err) {
        app.logger().error(
          "elite central: restamp reservations failed",
          "owner",
          matched[k].ownerId,
          "err",
          String(err),
        );
      }
    }

    try {
      app.logger().info(
        "elite central configured",
        "central",
        central.ownerId,
        "managed",
        matched.length - 1,
      );
    } catch (_) {}
  },
  (app) => {
    // Down: revert to the prior Alpine-centric routing by re-running the
    // original designation logic (prefer "alpine"). This is best-effort and
    // mirrors the original migration's behavior.
    var patterns = ["alpine", "elite", "airport car service"];
    var matched = [];
    try {
      var rows = app.findRecordsByFilter("settings", "id != ''", "created", 500, 0);
      for (var i = 0; i < rows.length; i++) {
        var s = rows[i];
        var name = String(s.get("businessName") || "").toLowerCase();
        var ownerVal = s.get("owner");
        var ownerId = "";
        if (Array.isArray(ownerVal)) ownerId = ownerVal[0] || "";
        else if (ownerVal) ownerId = String(ownerVal);
        if (!ownerId) continue;
        var hit = false;
        for (var p = 0; p < patterns.length; p++) {
          if (name.indexOf(patterns[p]) !== -1) {
            hit = true;
            break;
          }
        }
        if (!hit) continue;
        var exists = false;
        for (var m = 0; m < matched.length; m++) {
          if (matched[m].ownerId === ownerId) {
            exists = true;
            break;
          }
        }
        if (!exists) {
          matched.push({ ownerId: ownerId, businessName: s.get("businessName") || "" });
        }
      }
    } catch (err) {
      app.logger().error("elite central down: settings scan failed", "err", String(err));
    }

    if (matched.length < 2) return;

    var central = null;
    for (var c = 0; c < matched.length; c++) {
      if (/alpine/i.test(matched[c].businessName)) {
        central = matched[c];
        break;
      }
    }
    if (!central) central = matched[0];

    try {
      var centralOp = app.findRecordById("users", central.ownerId);
      if (centralOp) {
        centralOp.set("managedBy", "");
        app.save(centralOp);
      }
    } catch (err) {
      app.logger().error("elite central down: clear central failed", "err", String(err));
    }

    for (var j = 0; j < matched.length; j++) {
      if (matched[j].ownerId === central.ownerId) continue;
      try {
        var op = app.findRecordById("users", matched[j].ownerId);
        if (op) {
          op.set("managedBy", central.ownerId);
          app.save(op);
        }
      } catch (err) {
        app.logger().error("elite central down: set managedBy failed", "err", String(err));
      }
    }

    for (var k = 0; k < matched.length; k++) {
      if (matched[k].ownerId === central.ownerId) continue;
      try {
        var rrows = app.findRecordsByFilter(
          "reservations",
          "owner = {:owner}",
          "-created",
          1000,
          0,
          { owner: matched[k].ownerId },
        );
        for (var r = 0; r < rrows.length; r++) {
          var rec = rrows[r];
          rec.set("centralOperator", central.ownerId);
          app.save(rec);
        }
      } catch (err) {
        app.logger().error("elite central down: restamp failed", "err", String(err));
      }
    }
  },
);
