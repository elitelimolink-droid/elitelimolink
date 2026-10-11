/// <reference path="../pb_data/types.d.ts" />

// Remove the older duplicate Alpine and Teterboro operator accounts so the
// dashboard lists exactly three businesses: BJK LIMO RIDE BOOK plus the two
// most recently created Alpine and Teterboro accounts.
//
// Newest (kept, created 2026-10-06 00:19:07Z):
//   Alpine    limobjk+alpine-restore@gmail.com
//   Teterboro limobjk+teterboro-restore@gmail.com
// Older (removed):
//   Alpine    limobjk+alpine-airport-car-servi-1cda899c@gmail.com
//   Teterboro limobjk+teterboro-airport-car-se-1cede7c5@gmail.com
//
// Historical reservations owned by a removed account are reassigned to the
// central BJK operator. sourceName and centralOperator are left unchanged so
// origin labels and central-dashboard access stay intact. The kept accounts'
// settings, vehicle tiers, and booking links are not touched.
migrate(
  (app) => {
    var keepEmails = {
      "limobjk+alpine-restore@gmail.com": true,
      "limobjk+teterboro-restore@gmail.com": true,
      "limobjk@gmail.com": true,
    };

    var bjkId = "";
    try {
      var bjk = app.findFirstRecordByFilter("users", 'email = "limobjk@gmail.com"');
      if (bjk) bjkId = bjk.id;
    } catch (_) {}
    if (!bjkId) {
      try {
        var oldest = app.findRecordsByFilter("users", "id != ''", "created", 1, 0);
        if (oldest && oldest.length > 0) bjkId = oldest[0].id;
      } catch (_) {}
    }

    var users = [];
    try {
      users = app.findRecordsByFilter("users", "id != ''", "created", 500, 0);
    } catch (err) {
      app.logger().error("dedupe businesses: user scan failed", "err", String(err));
      return;
    }

    // Group Alpine / Teterboro accounts by name pattern, then drop every
    // account except the newest created one (and never drop a keep-list
    // account if it is that newest row).
    var groups = { alpine: [], teterboro: [] };
    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      var email = String(u.get("email") || "").toLowerCase();
      if (keepEmails[email] && email === "limobjk@gmail.com") continue;
      var label = (String(u.get("name") || "") + " " + email).toLowerCase();
      if (label.indexOf("alpine") !== -1) groups.alpine.push(u);
      else if (label.indexOf("teterboro") !== -1) groups.teterboro.push(u);
    }

    function newestId(list) {
      var best = null;
      var bestAt = "";
      for (var n = 0; n < list.length; n++) {
        var created = String(list[n].get("created") || "");
        if (!best || created > bestAt) {
          best = list[n];
          bestAt = created;
        }
      }
      return best ? best.id : "";
    }

    var keepIds = {};
    keepIds[newestId(groups.alpine)] = true;
    keepIds[newestId(groups.teterboro)] = true;
    if (bjkId) keepIds[bjkId] = true;

    var remove = [];
    for (var gName in groups) {
      var list = groups[gName];
      for (var j = 0; j < list.length; j++) {
        if (!keepIds[list[j].id]) remove.push(list[j]);
      }
    }

    for (var r = 0; r < remove.length; r++) {
      var op = remove[r];
      var opId = op.id;

      try {
        var rrows = app.findRecordsByFilter(
          "reservations",
          "owner = {:owner}",
          "-created",
          1000,
          0,
          { owner: opId },
        );
        for (var k = 0; k < rrows.length; k++) {
          var rec = rrows[k];
          if (bjkId) rec.set("owner", bjkId);
          app.save(rec);
        }
      } catch (err) {
        app.logger().error("dedupe businesses: reassign reservations failed", "owner", opId, "err", String(err));
      }

      try {
        var srows = app.findRecordsByFilter("settings", "owner = {:owner}", "-created", 500, 0, { owner: opId });
        for (var s = 0; s < srows.length; s++) app.delete(srows[s]);
      } catch (err) {
        app.logger().error("dedupe businesses: delete settings failed", "owner", opId, "err", String(err));
      }

      try {
        var trows = app.findRecordsByFilter("vehicle_tiers", "owner = {:owner}", "sort", 500, 0, { owner: opId });
        for (var t = 0; t < trows.length; t++) app.delete(trows[t]);
      } catch (err) {
        app.logger().error("dedupe businesses: delete tiers failed", "owner", opId, "err", String(err));
      }

      try {
        app.delete(op);
      } catch (err) {
        app.logger().error("dedupe businesses: delete user failed", "owner", opId, "err", String(err));
      }
    }
  },
  (app) => {
    // Deleted operator accounts and their settings cannot be restored.
  },
);
