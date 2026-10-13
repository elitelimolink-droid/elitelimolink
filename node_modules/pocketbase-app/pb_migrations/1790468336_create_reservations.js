/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const reservations = new Collection({
      type: "base",
      name: "reservations",
      listRule: null,
      viewRule: null,
      createRule: "",
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "service", type: "select", required: true, maxSelect: 1, values: ["ride", "hourly"] },
        { name: "pickup", type: "text", required: true, max: 300 },
        { name: "dropoff", type: "text", max: 300 },
        { name: "pickupAt", type: "date", required: true },
        { name: "returnAt", type: "date" },
        { name: "hours", type: "number", onlyInt: true, min: 2, max: 12 },
        { name: "vehicle", type: "select", required: true, maxSelect: 1, values: ["sedan", "suv", "van"] },
        { name: "passengers", type: "number", required: true, onlyInt: true, min: 1, max: 8 },
        { name: "name", type: "text", required: true, max: 150 },
        { name: "email", type: "email", required: true },
        { name: "phone", type: "text", required: true, max: 40 },
        { name: "flight", type: "text", max: 60 },
        { name: "notes", type: "text", max: 1000 },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
    app.save(reservations);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId("reservations"));
  },
);
