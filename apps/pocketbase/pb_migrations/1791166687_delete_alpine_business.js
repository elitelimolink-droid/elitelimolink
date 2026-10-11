/// <reference path="../pb_data/types.d.ts" />

// Delete the "Alpine Airport Car Service" business.
//
// Mirrors the Teterboro deletion: remove the business from the dashboard
// selector and revoke its booking configuration, while preserving its
// historical reservations and source labels in the central dashboard.
//
// What this migration does:
//   1. Resolves the Alpine operator by matching settings.businessName
//      (case-insensitive "alpine").
//   2. Reassigns every reservation owned by that operator to the central
//      (BJK LIMO RIDE BOOK) operator, so the historical reservations stay
//      fully visible and manageable from the central dashboard with no
//      dangling owner reference. `sourceName` is left untouched — each
//      reservation still shows "Alpine airport car service" as its origin
//      label — and `centralOperator` already points at BJK.
//   3. Deletes the operator's settings and vehicle_tiers rows, removing the
//      business's booking configuration so its `/?biz=<id>` link no longer
//      serves an Alpine-branded booking page.
//   4. Deletes the operator (user) account itself, removing it from the
//      business list / dashboard selector and revoking login access.
//
// This is a one-time data operation. The down migration is a no-op because
// a deleted user account cannot be faithfully restored.
migrate(
  (app) => {
    // 1. Resolve the Alpine operator from its settings.businessName.
    var alpineOwnerId = "";
    try {
      var rows = app.findRecordsByFilter("settings", "id != ''", "created", 500, 0);
      for (var i = 0; i < rows.length; i++) {
        var name = String(rows[i].get("businessName") || "").toLowerCase();
        if (name.indexOf("alpine") !== -1) {
          var ownerVal = rows[i].get("owner");
          if (Array.isArray(ownerVal)) alpineOwnerId = ownerVal[0] || "";
          else if (ownerVal) alpineOwnerId = String(ownerVal);
          break;
        }
      }
    } catch (err) {
      app.logger().error("delete alpine: settings scan failed", "err", String(err));
    }

    if (!alpineOwnerId) {
      try {
        app.logger().info("delete alpine: no matching business found; nothing to do");
      } catch (_) {}
      return;
    }

    // Resolve the central (BJK) operator to reassign reservations to.
    var bjkId = "";
    try {
      var bjk = app.findFirstRecordByFilter("users", 'email = "Limobjk@gmail.com"');
      if (bjk) bjkId = bjk.id;
    } catch (_) {}
    if (!bjkId) {
      try {
        var oldest = app.findRecordsByFilter("users", "id != ''", "created", 1, 0);
        if (oldest && oldest.length > 0) bjkId = oldest[0].id;
      } catch (_) {}
    }

    // 2. Reassign the Alpine operator's reservations to the central
    //    operator. sourceName and centralOperator are preserved.
    try {
      var rrows = app.findRecordsByFilter(
        "reservations",
        "owner = {:owner}",
        "-created",
        1000,
        0,
        { owner: alpineOwnerId },
      );
      for (var r = 0; r < rrows.length; r++) {
        var rec = rrows[r];
        if (bjkId) rec.set("owner", bjkId);
        app.save(rec);
      }
    } catch (err) {
      app.logger().error("delete alpine: reassign reservations failed", "err", String(err));
    }

    // 3. Delete the operator's settings rows.
    try {
      var srows = app.findRecordsByFilter(
        "settings",
        "owner = {:owner}",
        "-created",
        500,
        0,
        { owner: alpineOwnerId },
      );
      for (var s = 0; s < srows.length; s++) app.delete(srows[s]);
    } catch (err) {
      app.logger().error("delete alpine: delete settings failed", "err", String(err));
    }

    // 3b. Delete the operator's vehicle_tiers rows.
    try {
      var trows = app.findRecordsByFilter(
        "vehicle_tiers",
        "owner = {:owner}",
        "sort",
        500,
        0,
        { owner: alpineOwnerId },
      );
      for (var t = 0; t < trows.length; t++) app.delete(trows[t]);
    } catch (err) {
      app.logger().error("delete alpine: delete tiers failed", "err", String(err));
    }

    // 4. Delete the operator (user) account itself.
    try {
      var user = app.findRecordById("users", alpineOwnerId);
      if (user) app.delete(user);
    } catch (err) {
      app.logger().error("delete alpine: delete user failed", "err", String(err));
    }

    try {
      app.logger().info("delete alpine: complete", "owner", alpineOwnerId, "reassignedTo", bjkId);
    } catch (_) {}
  },
  (app) => {
    // Destructive one-time data deletion — no automatic rollback.
    try {
      app.logger().info("delete alpine: down migration is a no-op (data cannot be restored)");
    } catch (_) {}
  },
);
