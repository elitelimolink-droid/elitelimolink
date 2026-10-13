/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // Update the existing operator account to the operator's requested
    // email and password. Preserves the same single-operator setup,
    // closed public sign-up, and all existing reservation/settings data.
    let operator;
    try {
      operator = app.findFirstRecordByFilter(
        "users",
        'email = "operator@ridebits.local"',
      );
    } catch (e) {
      if (e.message && e.message.includes("no rows in result set")) {
        // No legacy operator account exists; create one with the new creds.
        operator = new Record(users);
      } else {
        throw e;
      }
    }

    operator.set("email", "Limobjk@gmail.com");
    operator.set("password", "Aliveli4950");
    operator.set("passwordConfirm", "Aliveli4950");
    operator.set("name", "Operator");
    operator.set("verified", true);
    app.save(operator);
  },
  (app) => {
    // Revert to the original seeded operator credentials.
    let operator;
    try {
      operator = app.findFirstRecordByFilter(
        "users",
        'email = "Limobjk@gmail.com"',
      );
    } catch (e) {
      if (e.message && e.message.includes("no rows in result set")) {
        return;
      }
      throw e;
    }

    operator.set("email", "operator@ridebits.local");
    operator.set("password", "RideBits2026!");
    operator.set("passwordConfirm", "RideBits2026!");
    app.save(operator);
  },
);
