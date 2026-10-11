/// <reference path="../pb_data/types.d.ts" />

// Three configurable vehicle categories (tiers). The operator can rename each
// tier, set its passenger capacity, set a per-tier minimum fare, and set a fare
// multiplier (e.g. 1.3× for a premium SUV). The booking flow reads the active
// tiers through the public /api/pricing endpoint (superuser read), so the
// collection itself stays operator-private — matching the `settings` pattern.

migrate(
  (app) => {
    const collection = new Collection({
      type: "base",
      name: "vehicle_tiers",
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: "key", type: "text", required: true, max: 40 },
        { name: "name", type: "text", required: true, max: 80 },
        { name: "detail", type: "text", max: 200 },
        { name: "capacity", type: "number", onlyInt: true, min: 1, max: 20 },
        { name: "minFare", type: "number", min: 0 },
        { name: "multiplier", type: "number", min: 0 },
        { name: "active", type: "bool" },
        { name: "sort", type: "number", onlyInt: true, min: 0 },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
    app.save(collection);

    const tiers = [
      { key: "sedan", name: "Executive sedan", detail: "A refined ride for everyday travel", capacity: 3, minFare: 25, multiplier: 1, active: true, sort: 1 },
      { key: "suv", name: "Premium SUV", detail: "More space for people and luggage", capacity: 6, minFare: 45, multiplier: 1.3, active: true, sort: 2 },
      { key: "van", name: "Passenger van", detail: "Travel together, comfortably", capacity: 8, minFare: 65, multiplier: 1.6, active: true, sort: 3 },
    ];

    tiers.forEach((t) => {
      const r = new Record(collection);
      r.set("key", t.key);
      r.set("name", t.name);
      r.set("detail", t.detail);
      r.set("capacity", t.capacity);
      r.set("minFare", t.minFare);
      r.set("multiplier", t.multiplier);
      r.set("active", t.active);
      r.set("sort", t.sort);
      app.save(r);
    });
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("vehicle_tiers");
      app.delete(collection);
    } catch (e) {
      if (e.message && e.message.indexOf("no rows") === -1) throw e;
    }
  },
);
