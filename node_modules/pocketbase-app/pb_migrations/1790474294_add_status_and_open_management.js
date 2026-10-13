/// <reference path="../pb_data/types.d.ts" />

// Adds a booking `status` field to reservations and opens management
// (list/view/update/delete) to the signed-in operator. Public sign-up is
// closed (1790471302), so @request.auth.id != '' is satisfiable only by the
// seeded operator account — the dispatch center. Public create stays open so
// the anonymous booking flow can still submit requests.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("reservations");

    if (!collection.fields.getByName("status")) {
      collection.fields.add(
        new SelectField({
          name: "status",
          maxSelect: 1,
          values: ["pending", "confirmed", "completed", "cancelled", "no_show"],
        }),
      );
    }

    collection.listRule = "@request.auth.id != ''";
    collection.viewRule = "@request.auth.id != ''";
    collection.updateRule = "@request.auth.id != ''";
    collection.deleteRule = "@request.auth.id != ''";
    app.save(collection);

    // Backfill every existing reservation to "pending" so the dispatch center
    // has a usable status on legacy rows.
    let rows = [];
    try {
      rows = app.findRecordsByFilter("reservations", "id != ''", "", 1000, 0) || [];
    } catch (e) {
      rows = [];
    }
    rows.forEach((r) => {
      if (!r.get("status")) {
        r.set("status", "pending");
        app.save(r);
      }
    });
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("reservations");
      collection.fields.removeByName("status");
      collection.listRule = null;
      collection.viewRule = null;
      collection.updateRule = null;
      collection.deleteRule = null;
      app.save(collection);
    } catch (e) {
      if (e.message && e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
