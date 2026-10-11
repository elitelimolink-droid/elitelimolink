/// <reference path="../pb_data/types.d.ts" />

// Per-business minimum advance notice (in hours) before pickup, selectable
// from 1 to 24 in the dashboard. Customers cannot place a reservation with a
// pickup sooner than this window. Defaults to 2 (the previous hardcoded
// minimum) so existing operators see no behavior change until they adjust it.
migrate(
  (app) => {
    const settings = app.findCollectionByNameOrId("settings");

    const existing = settings.fields.getByName("minAdvanceHours");
    if (existing) {
      if (existing.type === "number") {
        app.save(settings);
        return;
      }
      settings.fields.removeByName("minAdvanceHours");
    }
    settings.fields.add(new NumberField({ name: "minAdvanceHours", min: 1, max: 24 }));
    app.save(settings);

    // Backfill every existing settings row to 2 hours so the field is present
    // and the previous behavior is preserved until the operator changes it.
    const rows = app.findRecordsByFilter("settings", "id != ''", "-created", 1000, 0);
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.get("minAdvanceHours") === null || r.get("minAdvanceHours") === undefined) {
        r.set("minAdvanceHours", 2);
        app.save(r);
      }
    }
  },
  (app) => {
    try {
      const settings = app.findCollectionByNameOrId("settings");
      settings.fields.removeByName("minAdvanceHours");
      app.save(settings);
    } catch (e) {
      if (e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
