/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId("settings");
    } catch (_) {
      collection = new Collection({
        type: "base",
        name: "settings",
        // Operator-only: the signed-in admin (closed sign-up) can read & edit.
        // Public pricing is exposed through the /api/pricing route (superuser read),
        // so the dispatch email and full settings never become publicly readable.
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: null,
        fields: [
          { name: "baseRate", type: "number", required: true, min: 0 },
          { name: "minimumFare", type: "number", required: true, min: 0 },
          { name: "perMileRate", type: "number", required: true, min: 0 },
          { name: "hourlyRate", type: "number", required: true, min: 0 },
          { name: "currency", type: "text", required: true, max: 8 },
          { name: "dispatchEmail", type: "email" },
          { name: "dispatchName", type: "text", max: 120 },
          { name: "customerEmailEnabled", type: "bool" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(collection);
    }

    // Seed a single default settings row if none exists yet.
    const existing = app.findRecordsByFilter("settings", "id != ''", "-created", 1, 0);
    if (!existing || existing.length === 0) {
      const record = new Record(collection);
      record.set("baseRate", 5);
      record.set("minimumFare", 25);
      record.set("perMileRate", 3.5);
      record.set("hourlyRate", 65);
      record.set("currency", "USD");
      record.set("dispatchEmail", "");
      record.set("dispatchName", "RideBits Dispatch");
      record.set("customerEmailEnabled", true);
      app.save(record);
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("settings");
      app.delete(collection);
    } catch (e) {
      if (e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
