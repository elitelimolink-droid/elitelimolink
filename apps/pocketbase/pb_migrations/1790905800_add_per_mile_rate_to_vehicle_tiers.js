/// <reference path="../pb_data/types.d.ts" />

// Per-vehicle per-mile rate. Each vehicle tier now carries its own per-mile
// rate so distance-based fares use the chosen vehicle's rate directly,
// instead of the global per-mile rate × a tier multiplier. Existing tiers
// are backfilled from their owner's global per-mile rate × their current
// multiplier, so the distance fare stays the same until the operator edits
// it from the dashboard.
migrate(
  (app) => {
    const tiers = app.findCollectionByNameOrId("vehicle_tiers");
    if (!tiers.fields.getByName("perMileRate")) {
      tiers.fields.add(new NumberField({ name: "perMileRate", min: 0 }));
    }
    app.save(tiers);

    // Backfill each existing tier with a per-mile rate derived from its
    // owner's global per-mile rate × the tier's current multiplier. Tiers
    // that already have a per-mile rate are left untouched.
    const tierRows = app.findRecordsByFilter("vehicle_tiers", "id != ''", "sort", 500, 0);
    var ownerRateCache = {};
    for (var i = 0; i < tierRows.length; i++) {
      var t = tierRows[i];
      if (t.get("perMileRate")) continue;

      var ownerId = String(t.get("owner") || "");
      var globalRate = ownerRateCache[ownerId];
      if (globalRate === undefined) {
        globalRate = 3.5; // DEFAULT_PRICING.perMileRate fallback
        if (ownerId) {
          try {
            var settingsRows = app.findRecordsByFilter(
              "settings",
              "owner = {:owner}",
              "-created",
              1,
              0,
              { owner: ownerId },
            );
            if (settingsRows && settingsRows.length > 0) {
              var sr = settingsRows[0].get("perMileRate");
              if (typeof sr === "number" && sr > 0) globalRate = sr;
            }
          } catch (_) {}
        }
        ownerRateCache[ownerId] = globalRate;
      }

      var mult = t.get("multiplier");
      if (typeof mult !== "number" || mult <= 0) mult = 1;
      var rate = Math.round(globalRate * mult * 100) / 100;
      t.set("perMileRate", rate);
      app.save(t);
    }
  },
  (app) => {
    const tiers = app.findCollectionByNameOrId("vehicle_tiers");
    try {
      tiers.fields.removeByName("perMileRate");
    } catch (_) {}
    app.save(tiers);
  },
);
