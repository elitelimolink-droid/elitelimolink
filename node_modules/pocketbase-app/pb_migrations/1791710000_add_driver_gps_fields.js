/// <reference path="../pb_data/types.d.ts" />

// Adds GPS tracking and real-time status fields to the drivers collection
// so operators can monitor drivers on a live map, see where they are,
// and verify whether they are heading to the customer.
migrate(
  (app) => {
    const drivers = app.findCollectionByNameOrId("drivers");
    if (!drivers.fields.getByName("lat")) {
      drivers.fields.add(new NumberField({ name: "lat", min: -90, max: 90 }));
    }
    if (!drivers.fields.getByName("lng")) {
      drivers.fields.add(new NumberField({ name: "lng", min: -180, max: 180 }));
    }
    if (!drivers.fields.getByName("heading")) {
      drivers.fields.add(new NumberField({ name: "heading", min: 0, max: 360 }));
    }
    if (!drivers.fields.getByName("speed")) {
      drivers.fields.add(new NumberField({ name: "speed", min: 0 }));
    }
    if (!drivers.fields.getByName("onDuty")) {
      drivers.fields.add(new BoolField({ name: "onDuty" }));
    }
    if (!drivers.fields.getByName("lastLocationUpdate")) {
      drivers.fields.add(new DateField({ name: "lastLocationUpdate" }));
    }
    if (!drivers.fields.getByName("currentTripId")) {
      drivers.fields.add(new TextField({ name: "currentTripId", max: 50 }));
    }
    app.save(drivers);
  },
  (app) => {
    try {
      const drivers = app.findCollectionByNameOrId("drivers");
      drivers.fields.removeByName("lat");
      drivers.fields.removeByName("lng");
      drivers.fields.removeByName("heading");
      drivers.fields.removeByName("speed");
      drivers.fields.removeByName("onDuty");
      drivers.fields.removeByName("lastLocationUpdate");
      drivers.fields.removeByName("currentTripId");
      app.save(drivers);
    } catch (_) {}
  }
);
