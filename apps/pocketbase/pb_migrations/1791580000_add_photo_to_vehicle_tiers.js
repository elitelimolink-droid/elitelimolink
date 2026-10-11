/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("vehicle_tiers");

    // Add a photo field for each vehicle category (idempotent). Operators
    // upload a representative photo from the dashboard; customers see it in
    // the booking flow's vehicle selection step.
    if (!collection.fields.getByName("photo")) {
      collection.fields.add(
        new FileField({
          name: "photo",
          maxSelect: 1,
          maxSize: 5242880, // 5 MB
          mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        }),
      );
    }

    // Make tiers publicly readable so the customer booking page can load each
    // vehicle's photo in the browser without an auth token. The /api/pricing
    // snapshot already exposes every active tier's data publicly; this only
    // additionally exposes inactive tier configs (rates/capacity), which are
    // not sensitive. Dashboard editing still goes through the server-side
    // admin client, so the open read rules do not weaken operator edits.
    collection.listRule = "";
    collection.viewRule = "";

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("vehicle_tiers");
    try {
      collection.fields.removeByName("photo");
    } catch (_) {
      // field already absent
    }
    collection.listRule = "@request.auth.id != '' && owner = @request.auth.id";
    collection.viewRule = "@request.auth.id != '' && owner = @request.auth.id";
    app.save(collection);
  },
);
