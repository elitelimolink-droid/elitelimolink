/// <reference path="../pb_data/types.d.ts" />

// Operator-set flat prices for the optional booking add-ons: car seat, extra
// stop, and inside pickup. Each business can set a custom dollar amount per
// add-on; the booking flow shows the selected add-on's individual cost and
// adds it to the total when the operator's price-visibility setting is on.
// Defaults to 0 (no charge) so existing operators see no change until they
// set a price from the dashboard.
migrate(
  (app) => {
    const settings = app.findCollectionByNameOrId("settings");

    const ensure = (name) => {
      const existing = settings.fields.getByName(name);
      if (existing) {
        if (existing.type === "number") return;
        settings.fields.removeByName(name);
      }
      settings.fields.add(new NumberField({ name: name, min: 0 }));
    };

    ensure("carSeatPrice");
    ensure("extraStopPrice");
    ensure("insidePickupPrice");
    app.save(settings);

    // Backfill every existing settings row to 0 so the fields are present and
    // no charge is applied until the operator opts in.
    const rows = app.findRecordsByFilter("settings", "id != ''", "-created", 1000, 0);
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var changed = false;
      if (r.get("carSeatPrice") === null || r.get("carSeatPrice") === undefined) { r.set("carSeatPrice", 0); changed = true; }
      if (r.get("extraStopPrice") === null || r.get("extraStopPrice") === undefined) { r.set("extraStopPrice", 0); changed = true; }
      if (r.get("insidePickupPrice") === null || r.get("insidePickupPrice") === undefined) { r.set("insidePickupPrice", 0); changed = true; }
      if (changed) app.save(r);
    }
  },
  (app) => {
    try {
      const settings = app.findCollectionByNameOrId("settings");
      settings.fields.removeByName("carSeatPrice");
      settings.fields.removeByName("extraStopPrice");
      settings.fields.removeByName("insidePickupPrice");
      app.save(settings);
    } catch (e) {
      if (e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
