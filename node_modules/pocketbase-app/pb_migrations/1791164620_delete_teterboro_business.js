/// <reference path="../pb_data/types.d.ts" />

// Delete the "Teterboro Airport Car Service" business.
//
// The operator asked to remove this business from the business list and
// dashboard while preserving its historical reservations and source labels
// so central reservation history is not lost.
//
// What this migration does:
//   1. Resolves the Teterboro operator by matching settings.businessName
//      (case-insensitive "teterboro").
//   2. Reassigns every reservation owned by that operator to the central
//      (BJK LIMO RIDE BOOK) operator, so the historical reservations stay
//      fully visible and manageable from the central dashboard with no
//      dangling owner reference. `sourceName` is left untouched — each
//      reservation still shows "Teterboro airport car service" as its
//      origin label — and `centralOperator` already points at BJK.
//   3. Deletes the operator's settings and vehicle_tiers rows, removing the
//      business's booking configuration so its `/?biz=<id>` link no longer
//      serves a Teterboro-branded booking page.
//   4. Deletes the operator (user) account itself, removing it from the
//      business list / dashboard selector and revoking login access.
//
// This is a one-time data operation. The down migration is a no-op because
// a deleted user account cannot be faithfully restored.
migrate(
  (app) => {
    // 1. Resolve the Teterboro operator from its settings.businessName.
    var teterboroOwnerId = "";
    try {
      var rows = app.findRecordsByFilter("settings", "id != ''", "created", 500, 0);
      for (var i = 0; i < rows.length; i++) {
        var name = String(rows[i].get("businessName") || "").toLowerCase();
        if (name.indexOf("teterboro") !== -1) {
          var ownerVal = rows[i].get("owner");
          if (Array.isArray(ownerVal)) teterboroOwnerId = ownerVal[0] || "";
          else if (ownerVal) teterboroOwnerId = String(ownerVal);
          break;
        }
      }
    } catch (err) {
      app.logger().error("delete teterboro: settings scan failed", "err", String(err));
    }

    if (!teterboroOwnerId) {
      try {
        app.logger().info("delete teterboro: no matching business found; nothing to do");
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

    // 2. Reassign the Teterboro operator's reservations to the central
    //    operator. sourceName and centralOperator are preserved.
    try {
      var rrows = app.findRecordsByFilter(
        "reservations",
        "owner = {:owner}",
        "-created",
        1000,
        0,
        { owner: teterboroOwnerId },
      );
      for (var r = 0; r < rrows.length; r++) {
        var rec = rrows[r];
        if (bjkId) rec.set("owner", bjkId);
        app.save(rec);
      }
    } catch (err) {
      app.logger().error("delete teterboro: reassign reservations failed", "err", String(err));
    }

    // 3. Delete the operator's settings rows.
    try {
      var srows = app.findRecordsByFilter(
        "settings",
        "owner = {:owner}",
        "-created",
        500,
        0,
        { owner: teterboroOwnerId },
      );
      for (var s = 0; s < srows.length; s++) app.delete(srows[s]);
    } catch (err) {
      app.logger().error("delete teterboro: delete settings failed", "err", String(err));
    }

    // 3b. Delete the operator's vehicle_tiers rows.
    try {
      var trows = app.findRecordsByFilter(
        "vehicle_tiers",
        "owner = {:owner}",
        "sort",
        500,
        0,
        { owner: teterboroOwnerId },
      );
      for (var t = 0; t < trows.length; t++) app.delete(trows[t]);
    } catch (err) {
      app.logger().error("delete teterboro: delete tiers failed", "err", String(err));
    }

    // 4. Delete the operator (user) account itself.
    try {
      var user = app.findRecordById("users", teterboroOwnerId);
      if (user) app.delete(user);
    } catch (err) {
      app.logger().error("delete teterboro: delete user failed", "err", String(err));
    }

    try {
      app.logger().info("delete teterboro: complete", "owner", teterboroOwnerId, "reassignedTo", bjkId);
    } catch (_) {}
  },
  (app) => {
    // Destructive one-time data deletion — no automatic rollback.
    try {
      app.logger().info("delete teterboro: down migration is a no-op (data cannot be restored)");
    } catch (_) {}
  },
);
