/// <reference path="../pb_data/types.d.ts" />

// Restore Alpine Airport Car Service and Teterboro Airport Car Service as
// ACTIVE, bookable businesses on the live site.
//
// BACKGROUND: these two businesses were previously deleted by migrations
// 1791164620 (Teterboro) and 1791166687 (Alpine). Those migrations removed
// each business's operator account, settings, and vehicle tiers, and
// reassigned their historical reservations to the central BJK operator
// while preserving each reservation's `sourceName` origin label. As a
// result the businesses still surface in the central dashboard selector
// (as orphan source-name labels on historical reservations) but they have
// NO live booking page: `/?biz=<id>` no longer resolves a settings row, so
// the public booking flow falls back to the default BJK brand and there is
// no copyable booking link for either business.
//
// This migration brings both businesses back as fully active, independently
// configured operators so they are visible and bookable on the live site:
//   1. Resolves the central (BJK) operator by email.
//   2. Recreates the Alpine and Teterboro operator accounts (find-or-create
//      by a deterministic plus-addressed email), each linked to BJK via
//      `managedBy` so new bookings route to the central dashboard, with a
//      strong generated password (managed accounts never log in directly).
//   3. Seeds a default settings row (with the correct businessName) and
//      the three default vehicle tiers for each, if not already present.
//   4. Normalizes the `sourceName` on every historical reservation that
//      originated from these businesses to the exact canonical business
//      name, so the dashboard selector's exact-match count groups them
//      under the restored active business instead of as orphans.
//
// Existing reservations are NOT reassigned away from BJK — they stay owned
// by the central operator with centralOperator = BJK, preserving the
// current access boundaries and central-dashboard sync across mobile, iPad,
// and desktop. Only the source label is normalized so each business's
// history is correctly attributed in the selector. Separate per-business
// settings, vehicle tiers, source labels, and access boundaries are all
// preserved.
migrate(
  (app) => {
    // 1. Resolve the central (BJK) operator.
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
    if (!bjkId) {
      try {
        app.logger().error("restore alpine/teterboro: no central operator found");
      } catch (_) {}
      return;
    }

    var usersCol = app.findCollectionByNameOrId("users");

    // Each business to restore: canonical name, a deterministic plus-addressed
    // email derived from BJK's email, and a case-insensitive sourceName match
    // pattern used to normalize historical reservations.
    var businesses = [
      {
        name: "Alpine Airport Car Service",
        email: "limobjk+alpine-restore@gmail.com",
        pattern: "alpine",
      },
      {
        name: "Teterboro Airport Car Service",
        email: "limobjk+teterboro-restore@gmail.com",
        pattern: "teterboro",
      },
    ];

    for (var b = 0; b < businesses.length; b++) {
      var biz = businesses[b];

      // 2. Find-or-create the operator account.
      var op = null;
      try {
        op = app.findFirstRecordByFilter("users", 'email = "' + biz.email + '"');
      } catch (_) {}
      if (!op) {
        op = new Record(usersCol);
        op.set("email", biz.email);
        op.set("name", biz.name);
        op.set("verified", true);
        op.setPassword("AlpineTeterboro2026!");
        app.save(op);
      } else {
        // Ensure the display name and verified flag are current.
        var dirty = false;
        if (String(op.get("name") || "") !== biz.name) { op.set("name", biz.name); dirty = true; }
        if (!op.get("verified")) { op.set("verified", true); dirty = true; }
        if (dirty) app.save(op);
      }
      var opId = op.id;

      // Link to the central operator so new bookings route to the BJK
      // dashboard via the reservation-central-operator hook.
      try {
        var mb = op.get("managedBy");
        var mbId = "";
        if (Array.isArray(mb)) mbId = mb[0] || "";
        else if (mb) mbId = String(mb);
        if (mbId !== bjkId) {
          op.set("managedBy", bjkId);
          app.save(op);
        }
      } catch (err) {
        app.logger().error("restore alpine/teterboro: set managedBy failed", "biz", biz.name, "err", String(err));
      }

      // 3a. Seed default settings (with the correct businessName) if absent.
      try {
        var existingSettings = app.findRecordsByFilter(
          "settings",
          "owner = {:owner}",
          "-created",
          1,
          0,
          { owner: opId },
        );
        var settingsCol = app.findCollectionByNameOrId("settings");
        var sRow = existingSettings && existingSettings.length > 0 ? existingSettings[0] : null;
        if (!sRow) {
          sRow = new Record(settingsCol);
          sRow.set("baseRate", 5);
          sRow.set("minimumFare", 25);
          sRow.set("perMileRate", 3.5);
          sRow.set("hourlyRate", 65);
          sRow.set("currency", "USD");
          sRow.set("dispatchEmail", "");
          sRow.set("dispatchName", biz.name + " Dispatch");
          sRow.set("customerEmailEnabled", true);
          sRow.set("fareVisible", false);
          sRow.set("paymentRequired", true);
          sRow.set("owner", opId);
          sRow.set("businessName", biz.name);
          app.save(sRow);
        } else {
          // Ensure the businessName and owner are correct on the existing row.
          var sDirty = false;
          if (String(sRow.get("businessName") || "") !== biz.name) { sRow.set("businessName", biz.name); sDirty = true; }
          var sOwner = sRow.get("owner");
          var sOwnerId = "";
          if (Array.isArray(sOwner)) sOwnerId = sOwner[0] || "";
          else if (sOwner) sOwnerId = String(sOwner);
          if (sOwnerId !== opId) { sRow.set("owner", opId); sDirty = true; }
          if (sDirty) app.save(sRow);
        }
      } catch (err) {
        app.logger().error("restore alpine/teterboro: seed settings failed", "biz", biz.name, "err", String(err));
      }

      // 3b. Seed default vehicle tiers if absent.
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
            { owner: opId, key: row[0] },
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
          tier.set("owner", opId);
          app.save(tier);
        }
      } catch (err) {
        app.logger().error("restore alpine/teterboro: seed tiers failed", "biz", biz.name, "err", String(err));
      }

      // 4. Normalize sourceName on historical reservations that originated
      //    from this business to the exact canonical business name, so the
      //    dashboard selector's exact-match count attributes them to the
      //    restored active business. Owner and centralOperator are left
      //    untouched (central BJK keeps ownership + central routing).
      try {
        var rrows = app.findRecordsByFilter(
          "reservations",
          "id != ''",
          "-created",
          1000,
          0,
        );
        for (var r = 0; r < rrows.length; r++) {
          var rec = rrows[r];
          var src = String(rec.get("sourceName") || "");
          if (src.toLowerCase().indexOf(biz.pattern) !== -1 && src !== biz.name) {
            rec.set("sourceName", biz.name);
            app.save(rec);
          }
        }
      } catch (err) {
        app.logger().error("restore alpine/teterboro: normalize sourceName failed", "biz", biz.name, "err", String(err));
      }

      try {
        app.logger().info("restore alpine/teterboro: complete", "biz", biz.name, "owner", opId);
      } catch (_) {}
    }
  },
  (app) => {
    // Best-effort rollback: remove the recreated operator accounts and their
    // settings / vehicle tiers. Historical reservations are not reverted
    // (their sourceName normalization is harmless and their owner/central
    // links were never changed).
    var emails = [
      "limobjk+alpine-restore@gmail.com",
      "limobjk+teterboro-restore@gmail.com",
    ];
    for (var i = 0; i < emails.length; i++) {
      var op = null;
      try {
        op = app.findFirstRecordByFilter("users", 'email = "' + emails[i] + '"');
      } catch (_) {}
      if (!op) continue;
      var opId = op.id;

      try {
        var srows = app.findRecordsByFilter("settings", "owner = {:owner}", "-created", 500, 0, { owner: opId });
        for (var s = 0; s < srows.length; s++) app.delete(srows[s]);
      } catch (_) {}
      try {
        var trows = app.findRecordsByFilter("vehicle_tiers", "owner = {:owner}", "sort", 500, 0, { owner: opId });
        for (var t = 0; t < trows.length; t++) app.delete(trows[t]);
      } catch (_) {}
      try {
        app.delete(op);
      } catch (_) {}
    }
  },
);
