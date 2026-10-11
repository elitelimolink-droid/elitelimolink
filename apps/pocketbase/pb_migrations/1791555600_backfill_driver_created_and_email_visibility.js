/// <reference path="../pb_data/types.d.ts" />

// Backfill leftover data on the `drivers` auth collection after the
// `created`/`updated` autodate migration (1791554295):
//
//  - Drivers created BEFORE the autodate fields existed have empty
//    `created`/`updated` values. The dashboard sorts drivers by `-created`,
//    so an empty value leaves the record sorting incorrectly and is a
//    leftover from the original "invalid sort field" bug that made the
//    Drivers panel report 0 drivers. Backfill a real timestamp so every
//    driver sorts and displays consistently.
//
//  - Auth records hide their `email` by default (`emailVisibility = false`),
//    so the operator Drivers panel received `email: undefined` for every
//    driver and could not show a driver's contact email. Operators (who are
//    the only accounts allowed to list drivers besides the driver
//    themselves) need to see driver emails to manage and contact drivers,
//    so force `emailVisibility = true` on existing drivers. New drivers get
//    the same setting at sign-up (see use-driver-auth.ts).
migrate(
  (app) => {
    const rows = app.findRecordsByFilter("drivers", "id != ''", "id", 500, 0);
    const now = new Date().toISOString();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var changed = false;
      if (!r.get("created")) {
        r.set("created", now);
        changed = true;
      }
      if (!r.get("updated")) {
        r.set("updated", now);
        changed = true;
      }
      if (!r.getBool("emailVisibility")) {
        r.set("emailVisibility", true);
        changed = true;
      }
      if (changed) app.save(r);
    }
  },
  (app) => {
    // Non-destructive down: backfilled timestamps and emailVisibility are
    // intentional corrections, not state to revert.
  },
);
