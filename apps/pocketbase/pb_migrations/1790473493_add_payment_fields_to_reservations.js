/// <reference path="../pb_data/types.d.ts" />

// Adds payment tracking fields to reservations so Stripe checkout results can
// be recorded. `paid` is a soft flag set by the Stripe webhook once a checkout
// session completes; `stripeSessionId` links the reservation to its Stripe
// Checkout Session for reconciliation. Both are optional — reservations made
// while Stripe is not configured simply leave them empty.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("reservations");

    if (!collection.fields.getByName("paid")) {
      collection.fields.add(new BoolField({ name: "paid" }));
    }
    if (!collection.fields.getByName("stripeSessionId")) {
      collection.fields.add(new TextField({ name: "stripeSessionId", max: 80 }));
    }
    app.save(collection);
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("reservations");
      collection.fields.removeByName("paid");
      collection.fields.removeByName("stripeSessionId");
      app.save(collection);
    } catch (e) {
      if (e.message && e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
