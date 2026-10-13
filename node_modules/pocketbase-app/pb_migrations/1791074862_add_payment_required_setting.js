/// <reference path="../pb_data/types.d.ts" />

// Administrator-controlled payment requirement. Adds a per-business
// `paymentRequired` boolean to `settings`: when true (the default), the
// booking flow collects payment through the hosted checkout before
// completing the reservation — the existing behavior. When false, the
// checkout page is skipped entirely and the reservation is completed
// directly from the booking page (saved as confirmed), so the customer
// never leaves the site. Defaults to true so current operators keep
// requiring payment until they opt out from the dashboard.
migrate(
  (app) => {
    const settings = app.findCollectionByNameOrId("settings");

    const existing = settings.fields.getByName("paymentRequired");
    if (existing) {
      if (existing.type === "bool") return; // correct type already, skip
      settings.fields.removeByName("paymentRequired"); // wrong type, replace
    }

    settings.fields.add(
      new BoolField({
        name: "paymentRequired",
      }),
    );
    app.save(settings);

    // Backfill every existing settings row to true so current operators keep
    // requiring payment until they explicitly turn it off.
    const rows = app.findRecordsByFilter("settings", "id != ''", "-created", 1000, 0);
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.get("paymentRequired") === null || r.get("paymentRequired") === undefined) {
        r.set("paymentRequired", true);
        app.save(r);
      }
    }
  },
  (app) => {
    try {
      const settings = app.findCollectionByNameOrId("settings");
      settings.fields.removeByName("paymentRequired");
      app.save(settings);
    } catch (e) {
      if (e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
