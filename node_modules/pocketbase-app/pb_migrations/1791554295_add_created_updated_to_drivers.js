/// <reference path="../pb_data/types.d.ts" />

// The `drivers` auth collection was created without `created`/`updated`
// autodate fields, so the dashboard's `sort: "-created"` query failed with
// "invalid sort field \"created\"". Add the standard autodate fields so the
// Drivers panel can sort by creation time like every other collection.
migrate(
  (app) => {
    const drivers = app.findCollectionByNameOrId("drivers");

    if (!drivers.fields.getByName("created")) {
      drivers.fields.add(
        new AutodateField({ name: "created", onCreate: true, onUpdate: false }),
      );
    }
    if (!drivers.fields.getByName("updated")) {
      drivers.fields.add(
        new AutodateField({ name: "updated", onCreate: true, onUpdate: true }),
      );
    }

    app.save(drivers);
  },
  (app) => {
    const drivers = app.findCollectionByNameOrId("drivers");
    try {
      drivers.fields.removeByName("created");
    } catch (_) {
      /* already absent */
    }
    try {
      drivers.fields.removeByName("updated");
    } catch (_) {
      /* already absent */
    }
    app.save(drivers);
  },
);
