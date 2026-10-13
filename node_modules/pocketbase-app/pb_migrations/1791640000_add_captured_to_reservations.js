/// <reference path="../pb_data/types.d.ts" />

// Adds a `captured` boolean to reservations so the payment system can
// distinguish an authorized hold (card authorized, funds held but not yet
// charged) from a captured payment (funds actually collected after the
// service is completed).
//
// Flow: when a customer pays at booking, Square authorizes a hold on their
// card (autocomplete: false) and the reservation is marked `paid: true` with
// `captured: false`. The operator manually captures the authorized payment
// from the dashboard/dispatch only after the service is completed; Square's
// Complete Payment API then moves the payment to COMPLETED and this field is
// set to `true`. A reservation is never marked captured unless Square verifies
// the capture.
//
// Defaults to false so existing reservations (including any already-paid
// historical rows charged immediately) are treated as "authorized but not
// captured" — the operator can still capture them if a Square payment id is
// present, or leave them as-is.

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("reservations");

    const existing = collection.fields.getByName("captured");
    if (existing) {
      if (existing.type === "bool") return;
      collection.fields.removeByName("captured");
    }
    collection.fields.add(new BoolField({ name: "captured" }));
    app.save(collection);

    // Backfill every existing reservation to false (not captured). Bool fields
    // default to false on create, but existing rows created before this field
    // need an explicit value so the dashboard reads a defined state.
    const rows = app.findRecordsByFilter("reservations", "id != ''", "-created", 10000, 0);
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.get("captured") === null || r.get("captured") === undefined) {
        r.set("captured", false);
        app.save(r);
      }
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("reservations");
      collection.fields.removeByName("captured");
      app.save(collection);
    } catch (e) {
      if (e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
