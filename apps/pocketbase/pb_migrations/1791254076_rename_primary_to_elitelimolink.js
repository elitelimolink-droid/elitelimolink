/// <reference path="../pb_data/types.d.ts" />

// Rename the primary (central) business currently shown as "BJK LIMO RIDE BOOK"
// to "ELITELIMOLINK". Updates the business name in the operator's settings
// row and the operator account's display name so the new name appears on the
// main booking page, dashboard selector, settings panel, and confirmation
// emails. Historical reservation source labels (reservations.sourceName) are
// left untouched so past bookings keep their original business label. Booking
// links (/?biz=<id>) and all other settings are unchanged.
migrate(
  (app) => {
    const OLD_NAME = "BJK LIMO RIDE BOOK";
    const NEW_NAME = "ELITELIMOLINK";

    // Update the settings row whose businessName matches (case-insensitive).
    const settingsRows = app.findRecordsByFilter(
      "settings",
      "businessName != ''",
      "created",
      500,
      0,
    );
    let ownerId = "";
    for (var i = 0; i < settingsRows.length; i++) {
      var s = settingsRows[i];
      var name = String(s.get("businessName") || "");
      if (name.toLowerCase() === OLD_NAME.toLowerCase()) {
        s.set("businessName", NEW_NAME);
        app.save(s);
        var ownerVal = s.get("owner");
        if (Array.isArray(ownerVal)) {
          ownerId = ownerVal[0] || "";
        } else if (ownerVal) {
          ownerId = String(ownerVal);
        }
      }
    }

    // Sync the operator account's display name so every surface that reads
    // users.name (e.g. the /api/businesses fallback) shows the new name.
    if (ownerId) {
      try {
        var user = app.findRecordById("users", ownerId);
        if (user) {
          user.set("name", NEW_NAME);
          app.save(user);
        }
      } catch (_) {
        // user lookup failure is non-fatal; settings already saved
      }
    }
  },
  (app) => {
    const OLD_NAME = "BJK LIMO RIDE BOOK";
    const NEW_NAME = "ELITELIMOLINK";

    const settingsRows = app.findRecordsByFilter(
      "settings",
      "businessName != ''",
      "created",
      500,
      0,
    );
    let ownerId = "";
    for (var i = 0; i < settingsRows.length; i++) {
      var s = settingsRows[i];
      var name = String(s.get("businessName") || "");
      if (name === NEW_NAME) {
        s.set("businessName", OLD_NAME);
        app.save(s);
        var ownerVal = s.get("owner");
        if (Array.isArray(ownerVal)) {
          ownerId = ownerVal[0] || "";
        } else if (ownerVal) {
          ownerId = String(ownerVal);
        }
      }
    }

    if (ownerId) {
      try {
        var user = app.findRecordById("users", ownerId);
        if (user) {
          user.set("name", OLD_NAME);
          app.save(user);
        }
      } catch (_) {
        // non-fatal
      }
    }
  },
);
