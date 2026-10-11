/// <reference path="../pb_data/types.d.ts" />

// Central dashboard routing for consolidated multi-business management.
//
// Several businesses (e.g. "Alpine Airport Car Service", "Airport Car
// Service", "Elite Limo") are operated by the same team and should be
// managed from ONE central dashboard instead of three separate logins.
//
// Approach (preserves access boundaries + separate settings/source records):
//   - `users.managedBy` (self-relation) marks an operator as managed by a
//     central operator. The central operator is one of the matched
//     businesses (preferring "Alpine"); the others point at it.
//   - `reservations.centralOperator` (relation to users) is auto-stamped by
//     the reservation-central-operator hook from the owner's `managedBy` on
//     every new booking, and backfilled here for existing reservations.
//   - The reservations list/view/update/delete rules are relaxed so a record
//     is visible/manageable when `owner = @request.auth.id` OR
//     `centralOperator = @request.auth.id`. Each owner still sees only their
//     own; the central operator additionally sees every managed business's
//     reservations. `createRule` stays open (public booking form).
//   - `settings` and `vehicle_tiers` stay strictly owner-scoped — business
//     settings and source records are never merged or overwritten. Only the
//   reservation presentation is centralized; `sourceName` keeps identifying
//     where each request originated.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    if (!users.fields.getByName("managedBy")) {
      users.fields.add(
        new RelationField({
          name: "managedBy",
          collectionId: users.id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      );
    }
    app.save(users);

    const reservations = app.findCollectionByNameOrId("reservations");
    if (!reservations.fields.getByName("centralOperator")) {
      reservations.fields.add(
        new RelationField({
          name: "centralOperator",
          collectionId: users.id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      );
    }
    // Central operator sees & manages routed reservations; each owner keeps
    // full access to their own. createRule stays open for the public form.
    reservations.listRule =
      "@request.auth.id != '' && (owner = @request.auth.id || centralOperator = @request.auth.id)";
    reservations.viewRule =
      "@request.auth.id != '' && (owner = @request.auth.id || centralOperator = @request.auth.id)";
    reservations.updateRule =
      "@request.auth.id != '' && (owner = @request.auth.id || centralOperator = @request.auth.id)";
    reservations.deleteRule =
      "@request.auth.id != '' && (owner = @request.auth.id || centralOperator = @request.auth.id)";
    app.save(reservations);

    // --- Discover the target businesses by settings.businessName ---
    // Matched case-insensitively against substrings; operators are deduped
    // by owner id (e.g. "Alpine Airport Car Service" matches both "alpine"
    // and "airport car service" but counts once).
    var patterns = ["alpine", "elite", "airport car service"];
    var matched = []; // { ownerId, businessName }
    try {
      var rows = app.findRecordsByFilter("settings", "id != ''", "created", 500, 0);
      for (var i = 0; i < rows.length; i++) {
        var s = rows[i];
        var name = String(s.get("businessName") || "").toLowerCase();
        var ownerVal = s.get("owner");
        var ownerId = "";
        if (Array.isArray(ownerVal)) ownerId = ownerVal[0] || "";
        else if (ownerVal) ownerId = String(ownerVal);
        if (!ownerId) continue;

        var hit = false;
        for (var p = 0; p < patterns.length; p++) {
          if (name.indexOf(patterns[p]) !== -1) {
            hit = true;
            break;
          }
        }
        if (!hit) continue;

        var exists = false;
        for (var m = 0; m < matched.length; m++) {
          if (matched[m].ownerId === ownerId) {
            exists = true;
            break;
          }
        }
        if (!exists) {
          matched.push({ ownerId: ownerId, businessName: s.get("businessName") || "" });
        }
      }
    } catch (err) {
      app.logger().error("central dashboard: settings scan failed", "err", String(err));
    }

    if (matched.length >= 2) {
      // Designate the central operator: prefer the one whose name contains
      // "alpine"; otherwise the oldest matched (first in created-asc order).
      var central = null;
      for (var c = 0; c < matched.length; c++) {
        if (/alpine/i.test(matched[c].businessName)) {
          central = matched[c];
          break;
        }
      }
      if (!central) central = matched[0];

      // Link the other matched operators to the central operator.
      for (var j = 0; j < matched.length; j++) {
        if (matched[j].ownerId === central.ownerId) continue;
        try {
          var op = app.findRecordById("users", matched[j].ownerId);
          if (op && !op.get("managedBy")) {
            op.set("managedBy", central.ownerId);
            app.save(op);
          }
        } catch (err) {
          app.logger().error(
            "central dashboard: set managedBy failed",
            "owner",
            matched[j].ownerId,
            "err",
            String(err),
          );
        }
      }

      // Backfill existing reservations: stamp centralOperator on every
      // managed business's reservation so the central operator sees history
      // too. The central operator's own reservations need no stamp (owner
      // already grants access).
      for (var k = 0; k < matched.length; k++) {
        if (matched[k].ownerId === central.ownerId) continue;
        try {
          var rrows = app.findRecordsByFilter(
            "reservations",
            "owner = {:owner}",
            "-created",
            1000,
            0,
            { owner: matched[k].ownerId },
          );
          for (var r = 0; r < rrows.length; r++) {
            var rec = rrows[r];
            if (!rec.get("centralOperator")) {
              rec.set("centralOperator", central.ownerId);
              app.save(rec);
            }
          }
        } catch (err) {
          app.logger().error(
            "central dashboard: backfill reservations failed",
            "owner",
            matched[k].ownerId,
            "err",
            String(err),
          );
        }
      }

      try {
        app.logger().info(
          "central dashboard configured",
          "central",
          central.ownerId,
          "managed",
          matched.length - 1,
        );
      } catch (_) {}
    } else {
      try {
        app.logger().info(
          "central dashboard: fewer than 2 matched businesses found; rules still applied",
          "matched",
          matched.length,
        );
      } catch (_) {}
    }
  },
  (app) => {
    const reservations = app.findCollectionByNameOrId("reservations");
    reservations.listRule = "@request.auth.id != '' && owner = @request.auth.id";
    reservations.viewRule = "@request.auth.id != '' && owner = @request.auth.id";
    reservations.updateRule = "@request.auth.id != '' && owner = @request.auth.id";
    reservations.deleteRule = "@request.auth.id != '' && owner = @request.auth.id";
    reservations.fields.removeByName("centralOperator");
    app.save(reservations);

    const users = app.findCollectionByNameOrId("users");
    users.fields.removeByName("managedBy");
    app.save(users);
  },
);
