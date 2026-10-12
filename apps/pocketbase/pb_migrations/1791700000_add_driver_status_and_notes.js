/// <reference path="../pb_data/types.d.ts" />

// Adds driverStatus and driverNotes fields to reservations collection
// so drivers can update trip progression (accept, arrive, pick up, drop off)
// and record trip notes/summaries after dropping off passengers.
migrate(
  (app) => {
    const reservations = app.findCollectionByNameOrId("reservations");
    if (!reservations.fields.getByName("driverStatus")) {
      reservations.fields.add(
        new TextField({
          name: "driverStatus",
          max: 60,
        })
      );
    }
    if (!reservations.fields.getByName("driverNotes")) {
      reservations.fields.add(
        new TextField({
          name: "driverNotes",
          max: 2000,
        })
      );
    }
    app.save(reservations);
  },
  (app) => {
    try {
      const reservations = app.findCollectionByNameOrId("reservations");
      reservations.fields.removeByName("driverStatus");
      reservations.fields.removeByName("driverNotes");
      app.save(reservations);
    } catch (_) {}
  }
);
