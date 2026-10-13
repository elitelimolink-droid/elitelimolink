/// <reference path="../pb_data/types.d.ts" />

// Seed the two driver accounts that were created at runtime in the preview
// database only, so they also exist in the production database and appear in
// the operator's Drivers panel on the LIVE/published dashboard.
//
// ROOT CAUSE: the two drivers (Hande Bolat, Hasan) were registered through
// the public /driver/register page during preview testing. Runtime-created
// records live in the preview database only and do NOT transfer to the
// separate production database, so the published dashboard showed zero
// drivers even though the preview dashboard showed two. No migration had
// seeded them, so production had none.
//
// This migration replicates the verified driver PROFILES (name, email,
// phone, preferred vehicle) into production so they appear in the Drivers
// panel. It is idempotent (find-or-create by email): existing drivers —
// including the two already in preview — are left completely untouched;
// their profile and password are never overwritten.
//
// PASSWORDS: this migration does NOT set, hardcode, or expose any password.
// Each newly created driver account gets a random placeholder password that
// no one knows (generated at migration-run time, never stored in code or
// revealed). The driver sets their OWN password through the standard
// "Forgot password" flow on the driver login page, which emails them a
// reset link. This preserves the rule that operators never set or reset a
// driver's password.

migrate(
  (app) => {
    var driversCol = app.findCollectionByNameOrId("drivers");

    // The two drivers verified to exist in the preview database. Profile data
    // only — no passwords.
    var seeds = [
      { email: "icebjk@hotmail.com", name: "Hande Bolat", phone: "13473022271", vehicle: "sedan" },
      { email: "hasankasikciny34@hotmail.com", name: "Hasan", phone: "9297121627", vehicle: "sedan" },
    ];

    // Random placeholder password no one knows; the driver replaces it via
    // the password-reset flow. Not cryptographically critical — it is a
    // temporary lock that the driver's own reset replaces.
    function randomPlaceholder(len) {
      var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
      var out = "";
      for (var i = 0; i < len; i++) {
        out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      }
      return out;
    }

    var created = 0;
    var skipped = 0;
    for (var i = 0; i < seeds.length; i++) {
      var seed = seeds[i];

      // Find-or-create by email. findFirstRecordByFilter throws when no row
      // matches, so a try/catch guards the "does not exist" path.
      var existing = null;
      try {
        existing = app.findFirstRecordByFilter("drivers", 'email = "' + seed.email + '"');
      } catch (_) {}

      if (existing) {
        // Already exists (e.g. preview database) — never overwrite the
        // driver's own profile or password.
        skipped++;
        continue;
      }

      var rec = new Record(driversCol);
      rec.set("email", seed.email);
      rec.set("name", seed.name);
      rec.set("phone", seed.phone);
      rec.set("vehicle", seed.vehicle);
      rec.set("active", true);
      rec.set("emailVisibility", true);
      rec.set("verified", false);
      rec.setPassword(randomPlaceholder(24));
      app.save(rec);
      created++;
    }

    try {
      app.logger().info("seed drivers: complete", "created", created, "skipped", skipped);
    } catch (_) {}
  },
  (app) => {
    // One-way seed of real driver profiles; no meaningful rollback.
  },
);
