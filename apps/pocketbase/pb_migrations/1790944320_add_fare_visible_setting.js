/// <reference path="../pb_data/types.d.ts" />

// Administrator-controlled price visibility. Adds a per-business `fareVisible`
// boolean to `settings`: when true, estimated prices are shown to customers
// during booking (vehicle cards, fare estimates, review, checkout); when
// false, fares stay concealed. Defaults to false to preserve the previous
// customer-facing concealed-by-default behavior. The server-side fare
// calculation and payment totals are unaffected by this flag — only what the
// customer sees.
migrate(
  (app) => {
    const settings = app.findCollectionByNameOrId("settings");

    const existing = settings.fields.getByName("fareVisible");
    if (existing) {
      if (existing.type === "bool") return; // correct type already, skip
      settings.fields.removeByName("fareVisible"); // wrong type, replace
    }

    settings.fields.add(
      new BoolField({
        name: "fareVisible",
      }),
    );
    app.save(settings);

    // Backfill every existing settings row to concealed (false) so current
    // operators keep the previous concealed-by-default behavior until they
    // opt in from the dashboard.
    const rows = app.findRecordsByFilter("settings", "id != ''", "-created", 1000, 0);
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.get("fareVisible") === null || r.get("fareVisible") === undefined) {
        r.set("fareVisible", false);
        app.save(r);
      }
    }
  },
  (app) => {
    try {
      const settings = app.findCollectionByNameOrId("settings");
      settings.fields.removeByName("fareVisible");
      app.save(settings);
    } catch (e) {
      if (e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
