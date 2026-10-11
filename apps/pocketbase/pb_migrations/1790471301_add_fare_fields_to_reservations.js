/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("reservations");
    collection.fields.add(new NumberField({ name: "distanceMiles", min: 0 }));
    collection.fields.add(new NumberField({ name: "estimatedFare", min: 0 }));
    collection.fields.add(new TextField({ name: "estimatedFareText", max: 40 }));
    collection.fields.add(new TextField({ name: "pickupLocal", max: 80 }));
    collection.fields.add(new TextField({ name: "returnLocal", max: 80 }));
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("reservations");
    ["distanceMiles", "estimatedFare", "estimatedFareText", "pickupLocal", "returnLocal"].forEach(
      (name) => {
        const field = collection.fields.getByName(name);
        if (field) collection.fields.remove(field);
      },
    );
    app.save(collection);
  },
);
