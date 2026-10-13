/// <reference path="../pb_data/types.d.ts" />

// Repair the operator login that blocked the entire pricing pipeline.
//
// The earlier credential migration (1790510120) set the operator password with
// `record.set("password", "Aliveli4950")`. On auth records the generic `set`
// stores the raw string instead of hashing it, so every login attempt failed
// with "invalid login credentials" (visible in the PocketBase error log). With
// the operator unable to authenticate, dashboard saves never persisted, the
// `settings` collection stayed empty/stale, and /api/pricing always returned
// DEFAULT_PRICING to the customer booking flow — so prices "didn't change" no
// matter what the operator entered.
//
// This migration re-hashes the password with the canonical `setPassword` so the
// documented credentials (Limobjk@gmail.com / Aliveli4950) actually work. It
// locates the existing operator account by the current or legacy email, or
// creates one if none exists. No reservation, settings, or vehicle-tier data is
// touched.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    let operator = null;
    try {
      operator = app.findFirstRecordByFilter(
        "users",
        'email = "Limobjk@gmail.com"',
      );
    } catch (e) {
      if (!e || !e.message || !e.message.includes("no rows in result set")) {
        throw e;
      }
    }
    if (!operator) {
      try {
        operator = app.findFirstRecordByFilter(
          "users",
          'email = "operator@ridebits.local"',
        );
      } catch (e) {
        if (!e || !e.message || !e.message.includes("no rows in result set")) {
          throw e;
        }
      }
    }
    if (!operator) {
      operator = new Record(users);
    }

    operator.set("email", "Limobjk@gmail.com");
    // setPassword hashes the value; the previous set("password", raw) did not,
    // which is what broke login.
    operator.setPassword("Aliveli4950");
    operator.set("name", "Operator");
    operator.set("verified", true);
    app.save(operator);
  },
  (app) => {
    // One-way repair of a broken password hash; no meaningful rollback.
  },
);
