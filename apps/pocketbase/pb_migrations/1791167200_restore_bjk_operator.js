/// <reference path="../pb_data/types.d.ts" />

// Restore the BJK LIMO RIDE BOOK operator account and re-link orphaned data.
//
// ROOT CAUSE: every record in the `users` collection was deleted (the table
// is empty: 0 records). That cascade also emptied `settings` and
// `vehicle_tiers` and nullified `reservations.owner` /
// `reservations.centralOperator`. The 8 surviving reservations keep their
// `sourceName` origin labels but point at no operator. With no `users`
// record, `auth-with-password` for Limobjk@gmail.com returns
// "invalid login credentials" — which is the sign-in failure the operator
// sees. The earlier restore_operator_login migration (1791165061) ran before
// the deletion and its fallback targeted an account that no longer exists,
// so its setPassword had nothing durable to act on.
//
// This migration:
//   1. Recreates the BJK operator account (email Limobjk@gmail.com, password
//      Aliveli4950 via setPassword, name "BJK LIMO RIDE BOOK", verified).
//   2. Seeds a default settings row + the three default vehicle tiers for
//      BJK (the operator-onboarding hook may also fire on create; both paths
//      check for existing rows first, so no duplicates are created).
//   3. Re-links every orphaned reservation to BJK as owner AND
//      centralOperator, preserving each reservation's sourceName origin label.
//
// No access boundaries are loosened: BJK remains owner-scoped, and the
// reservations stay behind the existing owner||centralOperator rule.
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId("users");

    // 1. Find or create the BJK operator account.
    var bjk = null;
    var emails = ["Limobjk@gmail.com", "limobjk@gmail.com"];
    for (var i = 0; i < emails.length && !bjk; i++) {
      try {
        bjk = app.findFirstRecordByFilter("users", 'email = "' + emails[i] + '"');
      } catch (_) {}
    }
    if (!bjk) {
      bjk = new Record(usersCol);
      bjk.set("email", "Limobjk@gmail.com");
      bjk.set("name", "BJK LIMO RIDE BOOK");
      bjk.set("verified", true);
      bjk.setPassword("Aliveli4950");
      app.save(bjk);
    } else {
      // Account exists — ensure the password hash, name and verified flag.
      bjk.setPassword("Aliveli4950");
      bjk.set("verified", true);
      bjk.set("name", "BJK LIMO RIDE BOOK");
      app.save(bjk);
    }

    var bjkId = bjk.id;

    // 2. Seed default settings for BJK (skip if the onboarding hook already did).
    try {
      var existingSettings = app.findRecordsByFilter(
        "settings",
        "owner = {:owner}",
        "-created",
        1,
        0,
        { owner: bjkId },
      );
      if (!existingSettings || existingSettings.length === 0) {
        var settingsCol = app.findCollectionByNameOrId("settings");
        var s = new Record(settingsCol);
        s.set("baseRate", 5);
        s.set("minimumFare", 25);
        s.set("perMileRate", 3.5);
        s.set("hourlyRate", 65);
        s.set("currency", "USD");
        s.set("businessName", "BJK LIMO RIDE BOOK");
        s.set("dispatchEmail", "");
        s.set("dispatchName", "BJK LIMO RIDE BOOK Dispatch");
        s.set("customerEmailEnabled", true);
        s.set("fareVisible", false);
        s.set("paymentRequired", true);
        s.set("owner", bjkId);
        app.save(s);
      }
    } catch (err) {
      app.logger().error("restore bjk: seed settings failed", "err", String(err));
    }

    // 3. Seed default vehicle tiers for BJK (skip existing per key).
    try {
      var tiers = [
        ["sedan", "Executive sedan", "A refined ride for everyday travel", 3, 25, 1, 3.5, 1],
        ["suv", "Premium SUV", "More space for people and luggage", 6, 45, 1.3, 4.5, 2],
        ["van", "Passenger van", "Travel together, comfortably", 8, 65, 1.6, 5.5, 3],
      ];
      var tiersCol = app.findCollectionByNameOrId("vehicle_tiers");
      for (var t = 0; t < tiers.length; t++) {
        var row = tiers[t];
        var existing = app.findRecordsByFilter(
          "vehicle_tiers",
          "owner = {:owner} && key = {:key}",
          "sort",
          1,
          0,
          { owner: bjkId, key: row[0] },
        );
        if (existing && existing.length > 0) continue;
        var tier = new Record(tiersCol);
        tier.set("key", row[0]);
        tier.set("name", row[1]);
        tier.set("detail", row[2]);
        tier.set("capacity", row[3]);
        tier.set("minFare", row[4]);
        tier.set("multiplier", row[5]);
        tier.set("perMileRate", row[6]);
        tier.set("active", true);
        tier.set("sort", row[7]);
        tier.set("owner", bjkId);
        app.save(tier);
      }
    } catch (err) {
      app.logger().error("restore bjk: seed tiers failed", "err", String(err));
    }

    // 4. Re-link every orphaned reservation to BJK (owner + centralOperator),
    //    preserving sourceName.
    try {
      var rrows = app.findRecordsByFilter("reservations", "id != ''", "-created", 1000, 0);
      for (var r = 0; r < rrows.length; r++) {
        var rec = rrows[r];
        var changed = false;

        var ownerVal = rec.get("owner");
        var ownerId = "";
        if (Array.isArray(ownerVal)) ownerId = ownerVal[0] || "";
        else if (ownerVal) ownerId = String(ownerVal);
        if (ownerId !== bjkId) {
          rec.set("owner", bjkId);
          changed = true;
        }

        var centralVal = rec.get("centralOperator");
        var centralId = "";
        if (Array.isArray(centralVal)) centralId = centralVal[0] || "";
        else if (centralVal) centralId = String(centralVal);
        if (centralId !== bjkId) {
          rec.set("centralOperator", bjkId);
          changed = true;
        }

        if (changed) app.save(rec);
      }
    } catch (err) {
      app.logger().error("restore bjk: relink reservations failed", "err", String(err));
    }

    try {
      app.logger().info("restore bjk: complete", "bjk", bjkId);
    } catch (_) {}
  },
  (app) => {
    // One-way restoration of a deleted operator account; no meaningful rollback.
  },
);
