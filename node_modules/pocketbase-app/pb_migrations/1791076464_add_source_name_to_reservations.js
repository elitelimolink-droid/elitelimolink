/// <reference path="../pb_data/types.d.ts" />

// Unified reservations source labeling:
// Each reservation now retains the business/source name it was booked under,
// so the consolidated dashboard and dispatch views can show where every
// reservation came from — even if the operator later renames the business.
// Access rules are unchanged (owner-scoped), so operators still only see the
// reservations they are authorized to manage; this field is purely a label.
migrate(
  (app) => {
    const reservations = app.findCollectionByNameOrId("reservations");
    reservations.fields.add(new TextField({ name: "sourceName", max: 80 }));
    app.save(reservations);

    // Backfill: stamp every existing reservation with its owning business's
    // current name so the origin is visible immediately in the consolidated view.
    const rows = app.findRecordsByFilter("reservations", "id != ''", "-created", 1000, 0);
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.get("sourceName")) continue;

      var ownerVal = r.get("owner");
      var ownerId = "";
      if (Array.isArray(ownerVal)) {
        ownerId = ownerVal[0] || "";
      } else if (ownerVal) {
        ownerId = String(ownerVal);
      }

      var name = "";
      if (ownerId) {
        try {
          var settingsRows = app.findRecordsByFilter(
            "settings",
            "owner = {:owner}",
            "-created",
            1,
            0,
            { owner: ownerId },
          );
          if (settingsRows && settingsRows.length > 0) {
            name = settingsRows[0].get("businessName") || "";
          }
        } catch (_) {}
      }
      r.set("sourceName", name || "");
      app.save(r);
    }
  },
  (app) => {
    const reservations = app.findCollectionByNameOrId("reservations");
    reservations.fields.removeByName("sourceName");
    app.save(reservations);
  },
);
