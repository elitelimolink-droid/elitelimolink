/// <reference path="../pb_data/types.d.ts" />

// Tip, tax, and tolls support for distance-based pricing.
//
// settings: adds operator-controlled toggles and rates for an optional
//   gratuity, an optional tax, and whether to include estimated tolls in the
//   customer total. All default off / 0 so existing operators see no change
//   until they opt in from the dashboard.
//
// reservations: stores the full fare breakdown (subtotal, tolls, tip, tax,
//   total) so the dispatch email, dashboard, and payment record all agree on
//   the exact amount the customer was charged.
migrate(
  (app) => {
    // --- settings: tip / tax / tolls controls ---
    const settings = app.findCollectionByNameOrId("settings");

    if (!settings.fields.getByName("tipEnabled")) {
      settings.fields.add(new BoolField({ name: "tipEnabled" }));
    }
    if (!settings.fields.getByName("tipPercent")) {
      settings.fields.add(new NumberField({ name: "tipPercent", min: 0, max: 100 }));
    }
    if (!settings.fields.getByName("taxEnabled")) {
      settings.fields.add(new BoolField({ name: "taxEnabled" }));
    }
    if (!settings.fields.getByName("taxPercent")) {
      settings.fields.add(new NumberField({ name: "taxPercent", min: 0, max: 100 }));
    }
    if (!settings.fields.getByName("tollsEnabled")) {
      settings.fields.add(new BoolField({ name: "tollsEnabled" }));
    }
    app.save(settings);

    // --- reservations: fare breakdown ---
    const reservations = app.findCollectionByNameOrId("reservations");

    if (!reservations.fields.getByName("subtotal")) {
      reservations.fields.add(new NumberField({ name: "subtotal", min: 0 }));
    }
    if (!reservations.fields.getByName("tollAmount")) {
      reservations.fields.add(new NumberField({ name: "tollAmount", min: 0 }));
    }
    if (!reservations.fields.getByName("tipAmount")) {
      reservations.fields.add(new NumberField({ name: "tipAmount", min: 0 }));
    }
    if (!reservations.fields.getByName("taxAmount")) {
      reservations.fields.add(new NumberField({ name: "taxAmount", min: 0 }));
    }
    app.save(reservations);
  },
  (app) => {
    const settings = app.findCollectionByNameOrId("settings");
    ["tipEnabled", "tipPercent", "taxEnabled", "taxPercent", "tollsEnabled"].forEach((name) => {
      try { settings.fields.removeByName(name); } catch (_) {}
    });
    app.save(settings);

    const reservations = app.findCollectionByNameOrId("reservations");
    ["subtotal", "tollAmount", "tipAmount", "taxAmount"].forEach((name) => {
      try { reservations.fields.removeByName(name); } catch (_) {}
    });
    app.save(reservations);
  },
);
