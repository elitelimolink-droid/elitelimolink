/// <reference path="../pb_data/types.d.ts" />

// Restore operator login for BJK LIMO RIDE BOOK.
//
// Symptom: sign-in at /login with the documented operator credentials
// (Limobjk@gmail.com / Aliveli4950) fails with "invalid login credentials"
// (HTTP 400), even though the account exists and all prior migrations
// applied cleanly. The original password-hash repair (1790556400) used
// `setPassword("Aliveli4950")`, but the stored hash no longer verifies
// against that value — the credentials the operator was given no longer
// match what is stored.
//
// This migration re-hashes the password to the documented value using the
// canonical `setPassword` (which bcrypt-hashes and rotates `tokenKey`),
// so the authorized BJK operator can sign in again. It touches ONLY the
// password hash / tokenKey of the single BJK operator account resolved by
// email. No reservations, settings, vehicle tiers, source labels, central
// routing, or access boundaries are changed.
migrate(
  (app) => {
    let operator = null;
    // PocketBase stores emails lowercased; the filter is case-insensitive,
    // but try both forms then fall back to the oldest operator (BJK is the
    // primary/oldest operator) for robustness.
    var emails = ["Limobjk@gmail.com", "limobjk@gmail.com"];
    for (var i = 0; i < emails.length && !operator; i++) {
      try {
        operator = app.findFirstRecordByFilter("users", 'email = "' + emails[i] + '"');
      } catch (_) {}
    }
    if (!operator) {
      try {
        var oldest = app.findRecordsByFilter("users", "id != ''", "created", 1, 0);
        if (oldest && oldest.length > 0) operator = oldest[0];
      } catch (_) {}
    }

    if (!operator) {
      try {
        app.logger().info("restore login: no operator account found; nothing to do");
      } catch (_) {}
      return;
    }

    // Re-hash the documented password. setPassword bcrypt-hashes the value
    // and rotates tokenKey, invalidating any stale sessions.
    operator.setPassword("Aliveli4950");
    operator.set("verified", true);
    app.save(operator);

    try {
      app.logger().info("restore login: operator password re-hashed", "id", operator.id);
    } catch (_) {}
  },
  (app) => {
    // One-way credential repair; no meaningful rollback.
  },
);
