/// <reference path="../pb_data/types.d.ts" />

// Live activity logging for the booking site.
//
// Captures anonymous visitor interactions (clicks, selected addresses, booking
// actions) so the operator can monitor real-time activity in the dashboard's
// Live activity feed alongside reservation events. Records are created only by
// the server (`/api/activity`, superuser) — the public never writes directly —
// so the owning business and central-operator routing are authoritative and
// cannot be spoofed from the browser.
//
// Access mirrors `reservations`: the owning operator and their central operator
// can list/view; nobody else can. This preserves business separation and the
// central-dashboard grouping while keeping every other operation server-only.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    let collection;
    try {
      collection = app.findCollectionByNameOrId("activity_events");
    } catch (_) {
      collection = new Collection({
        type: "base",
        name: "activity_events",
        // Owner + central-operator scoped reads (same shape as reservations).
        listRule:
          "@request.auth.id != '' && (owner = @request.auth.id || centralOperator = @request.auth.id)",
        viewRule:
          "@request.auth.id != '' && (owner = @request.auth.id || centralOperator = @request.auth.id)",
        // Writes are server-only (superuser via /api/activity).
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: "type", type: "text", required: true, max: 40 },
          { name: "label", type: "text", required: true, max: 300 },
          { name: "target", type: "text", max: 200 },
          { name: "page", type: "text", max: 300 },
          { name: "session", type: "text", max: 60 },
          { name: "meta", type: "json", maxSize: 8000 },
          {
            name: "owner",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          {
            name: "centralOperator",
            type: "relation",
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: false,
          },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(collection);
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("activity_events");
      app.delete(collection);
    } catch (e) {
      if (e.message && e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
