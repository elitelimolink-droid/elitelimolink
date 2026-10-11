/// <reference path="../pb_data/types.d.ts" />

// Adds a `squareOrderId` text field to reservations so the Square webhook can
// record the Square order/payment id when a booking is paid through Square
// Checkout. Replaces the legacy `stripeSessionId` reference for new payments;
// existing `stripeSessionId` values are preserved on historical rows.

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("reservations");

    if (!collection.fields.getByName("squareOrderId")) {
      collection.fields.add(new TextField({ name: "squareOrderId" }));
    }
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("reservations");
    collection.fields.removeByName("squareOrderId");
    app.save(collection);
  },
);
