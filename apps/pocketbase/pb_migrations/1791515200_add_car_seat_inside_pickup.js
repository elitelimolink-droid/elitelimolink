/// <reference path="../pb_data/types.d.ts" />

// Adds two optional customer-selected add-ons to reservations:
//   carSeat      — customer requested a car seat (extra charge applies)
//   insidePickup — customer requested inside pickup / meet-and-greet (extra charge applies)
// Both are optional booleans (default false). No fare amount is stored — the
// charge is noted to the customer and confirmed by dispatch. Existing rows
// backfill to false.

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("reservations");

    if (!collection.fields.getByName("carSeat")) {
      collection.fields.add(new BoolField({ name: "carSeat" }));
    }
    if (!collection.fields.getByName("insidePickup")) {
      collection.fields.add(new BoolField({ name: "insidePickup" }));
    }
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("reservations");
    collection.fields.removeByName("carSeat");
    collection.fields.removeByName("insidePickup");
    app.save(collection);
  },
);
