/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // Close public sign-up: this is a single-operator app, so only the seeded
    // operator account should exist. The operator can still update their own
    // profile (name, avatar, password) under the existing updateRule.
    users.createRule = null;
    app.save(users);

    // Seed the operator account if it does not already exist.
    const existing = app.findRecordsByFilter(
      "users",
      'email = "operator@ridebits.local"',
      "",
      1,
      0,
    );
    if (!existing || existing.length === 0) {
      const admin = new Record(users);
      admin.set("email", "operator@ridebits.local");
      admin.set("password", "RideBits2026!");
      admin.set("passwordConfirm", "RideBits2026!");
      admin.set("name", "Operator");
      admin.set("verified", true);
      app.save(admin);
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.createRule = "";
    app.save(users);
  },
);
