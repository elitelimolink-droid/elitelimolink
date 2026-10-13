/// <reference path="../pb_data/types.d.ts" />

// Lowercase the BJK operator email so the sign-in identity matches.
//
// The restored BJK account (1791167200) stored its email as
// "Limobjk@gmail.com" (mixed case). The login page normalizes the submitted
// email to lowercase before calling auth-with-password, and PocketBase's
// auth identity match is case-sensitive against the stored value — so
// "limobjk@gmail.com" never matched "Limobjk@gmail.com" and login failed
// with "Failed to authenticate." even though the password was correct.
//
// This delta lowercases the stored email of the BJK operator (and any other
// user whose email is not already lowercase) so the lowercased sign-in
// identity matches. Password, name, verified flag, settings, tiers, and
// reservations are untouched.
migrate(
  (app) => {
    var target = null;

    // Resolve BJK by the mixed-case form first (case-sensitive filter match),
    // then by the lowercase form, then scan all users for any non-lowercase
    // email as a safety net.
    var emails = ["Limobjk@gmail.com", "limobjk@gmail.com"];
    for (var i = 0; i < emails.length && !target; i++) {
      try {
        target = app.findFirstRecordByFilter("users", 'email = "' + emails[i] + '"');
      } catch (_) {}
    }

    if (!target) {
      try {
        var all = app.findRecordsByFilter("users", "id != ''", "created", 500, 0);
        for (var j = 0; j < all.length; j++) {
          var em = String(all[j].get("email") || "");
          if (em && em !== em.toLowerCase()) {
            target = all[j];
            break;
          }
        }
      } catch (_) {}
    }

    if (!target) {
      try {
        app.logger().info("lowercase bjk email: no operator found; nothing to do");
      } catch (_) {}
      return;
    }

    var current = String(target.get("email") || "");
    if (current !== current.toLowerCase()) {
      target.set("email", current.toLowerCase());
      app.save(target);
      try {
        app.logger().info("lowercase bjk email: normalized", "id", target.id);
      } catch (_) {}
    }
  },
  (app) => {
    // One-way normalization; no meaningful rollback.
  },
);
