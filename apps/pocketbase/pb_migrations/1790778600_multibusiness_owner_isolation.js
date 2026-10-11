/// <reference path="../pb_data/types.d.ts" />

// Multi-business isolation:
//  - `users` sign-up opens so each business can create its own operator
//    account (users carries no privileged fields, so self-service create is
//    safe; the onboarding hook seeds each new operator's dashboard).
//  - `settings`, `vehicle_tiers`, and `reservations` gain an `owner`
//    relation and owner-scoped rules, so every operator sees and manages
//    only their own business data. Reservations keep an open createRule so
//    the public booking form (which sends the target operator's id) can
//    still submit anonymously.
//  - All existing rows are backfilled to the current operator
//    (Limobjk@gmail.com), so current data stays with the original business.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    users.createRule = "";
    app.save(users);

    // --- settings: owner-scoped + public business display name ---
    const settings = app.findCollectionByNameOrId("settings");
    settings.fields.add(
      new RelationField({
        name: "owner",
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    );
    settings.fields.add(new TextField({ name: "businessName", max: 80 }));
    settings.listRule = "@request.auth.id != '' && owner = @request.auth.id";
    settings.viewRule = "@request.auth.id != '' && owner = @request.auth.id";
    settings.createRule = "@request.auth.id != '' && owner = @request.auth.id";
    settings.updateRule = "@request.auth.id != '' && owner = @request.auth.id";
    settings.deleteRule = null;
    app.save(settings);

    // --- vehicle_tiers: owner-scoped ---
    const tiers = app.findCollectionByNameOrId("vehicle_tiers");
    tiers.fields.add(
      new RelationField({
        name: "owner",
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    );
    tiers.listRule = "@request.auth.id != '' && owner = @request.auth.id";
    tiers.viewRule = "@request.auth.id != '' && owner = @request.auth.id";
    tiers.createRule = "@request.auth.id != '' && owner = @request.auth.id";
    tiers.updateRule = "@request.auth.id != '' && owner = @request.auth.id";
    tiers.deleteRule = "@request.auth.id != '' && owner = @request.auth.id";
    app.save(tiers);

    // --- reservations: owner-scoped management, public create stays open ---
    const reservations = app.findCollectionByNameOrId("reservations");
    reservations.fields.add(
      new RelationField({
        name: "owner",
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    );
    reservations.listRule = "@request.auth.id != '' && owner = @request.auth.id";
    reservations.viewRule = "@request.auth.id != '' && owner = @request.auth.id";
    reservations.createRule = "";
    reservations.updateRule = "@request.auth.id != '' && owner = @request.auth.id";
    reservations.deleteRule = "@request.auth.id != '' && owner = @request.auth.id";
    app.save(reservations);

    // --- Backfill: associate all existing data with the current operator ---
    let operator = null;
    try {
      operator = app.findAuthRecordByEmail("users", "Limobjk@gmail.com");
    } catch (_) {
      const rows = app.findRecordsByFilter("users", "id != ''", "created", 1, 0);
      if (rows && rows.length > 0) operator = rows[0];
    }
    if (operator) {
      const ownerId = operator.id;

      const settingRows = app.findRecordsByFilter("settings", "id != ''", "-created", 100, 0);
      for (var i = 0; i < settingRows.length; i++) {
        var s = settingRows[i];
        if (!s.get("owner")) {
          s.set("owner", ownerId);
          if (!s.get("businessName")) s.set("businessName", "BJK LIMO RIDE BOOK");
          app.save(s);
        }
      }

      const tierRows = app.findRecordsByFilter("vehicle_tiers", "id != ''", "sort", 100, 0);
      for (var j = 0; j < tierRows.length; j++) {
        var t = tierRows[j];
        if (!t.get("owner")) {
          t.set("owner", ownerId);
          app.save(t);
        }
      }

      const reservationRows = app.findRecordsByFilter("reservations", "id != ''", "-created", 1000, 0);
      for (var k = 0; k < reservationRows.length; k++) {
        var r = reservationRows[k];
        if (!r.get("owner")) {
          r.set("owner", ownerId);
          app.save(r);
        }
      }
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.createRule = null;
    app.save(users);

    const settings = app.findCollectionByNameOrId("settings");
    settings.fields.removeByName("owner");
    settings.fields.removeByName("businessName");
    settings.listRule = "@request.auth.id != ''";
    settings.viewRule = "@request.auth.id != ''";
    settings.createRule = "@request.auth.id != ''";
    settings.updateRule = "@request.auth.id != ''";
    settings.deleteRule = null;
    app.save(settings);

    const tiers = app.findCollectionByNameOrId("vehicle_tiers");
    tiers.fields.removeByName("owner");
    tiers.listRule = "@request.auth.id != ''";
    tiers.viewRule = "@request.auth.id != ''";
    tiers.createRule = "@request.auth.id != ''";
    tiers.updateRule = "@request.auth.id != ''";
    tiers.deleteRule = "@request.auth.id != ''";
    app.save(tiers);

    const reservations = app.findCollectionByNameOrId("reservations");
    reservations.fields.removeByName("owner");
    reservations.listRule = "@request.auth.id != ''";
    reservations.viewRule = "@request.auth.id != ''";
    reservations.createRule = "";
    reservations.updateRule = "@request.auth.id != ''";
    reservations.deleteRule = "@request.auth.id != ''";
    app.save(reservations);
  },
);
