/// <reference path="../pb_data/types.d.ts" />

// Adds an optional `extraStop` address field to reservations so customers can
// request one additional stop alongside pickup and dropoff. The field is
// optional (not required) and reuses the same autocomplete/verification flow
// as the other location fields. Existing rows simply have an empty value.

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("reservations");

    if (collection.fields.getByName("extraStop")) return;

    collection.fields.add(
      new TextField({
        name: "extraStop",
        required: false,
        max: 300,
      }),
    );
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("reservations");
    collection.fields.removeByName("extraStop");
    app.save(collection);
  },
);
