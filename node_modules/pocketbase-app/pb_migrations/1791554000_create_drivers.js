/// <reference path="../pb_data/types.d.ts" />

// Drivers section — a separate auth collection so drivers have their own
// accounts, passwords, and sign-in area, fully isolated from operator/admin
// (`users`) access. Drivers self-register and choose their own passwords
// (createRule is public). Operators (any signed-in `users` account) can list,
// view, update, and delete driver records, but never set or reset a driver's
// password — only the driver controls that.
//
// Reservations gain an optional `driver` relation so an operator can assign a
// trip to a driver. The reservation list/view rules are extended so a signed-in
// driver sees only the reservations assigned to them (read-only — they cannot
// create, update, or delete reservations).
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const uid = users.id;

    // --- drivers auth collection (find-or-create) ---
    let drivers;
    try {
      drivers = app.findCollectionByNameOrId("drivers");
    } catch (_) {
      drivers = new Collection({
        type: "auth",
        name: "drivers",
        passwordAuth: { enabled: true },
        authAlert: { enabled: false },
        fields: [
          { name: "name", type: "text", max: 100 },
          { name: "phone", type: "text", max: 40 },
          {
            name: "vehicle",
            type: "select",
            maxSelect: 1,
            values: ["sedan", "suv", "van"],
          },
          { name: "active", type: "bool" },
        ],
      });
      app.save(drivers);
    }
    const did = drivers.id;

    // Drivers see only their own record; operators (users) see every driver.
    drivers.listRule =
      "@request.auth.collectionId = '" + uid + "' || " +
      "(@request.auth.collectionId = '" + did + "' && id = @request.auth.id)";
    drivers.viewRule = drivers.listRule;
    // Public self-registration so drivers create their own accounts/passwords.
    drivers.createRule = "";
    // A driver may update their own profile (incl. password); operators may
    // update any driver record (vehicle, active, etc.).
    drivers.updateRule =
      "@request.auth.collectionId = '" + uid + "' || " +
      "(@request.auth.collectionId = '" + did + "' && id = @request.auth.id)";
    // Only operators delete driver accounts.
    drivers.deleteRule = "@request.auth.collectionId = '" + uid + "'";
    app.save(drivers);

    // --- reservations: optional driver relation + driver read access ---
    const reservations = app.findCollectionByNameOrId("reservations");
    if (!reservations.fields.getByName("driver")) {
      reservations.fields.add(
        new RelationField({
          name: "driver",
          collectionId: did,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      );
    }
    reservations.listRule =
      "@request.auth.id != '' && (" +
      "owner = @request.auth.id || " +
      "centralOperator = @request.auth.id || " +
      "(@request.auth.collectionId = '" + did + "' && driver = @request.auth.id)" +
      ")";
    reservations.viewRule = reservations.listRule;
    // createRule stays public (booking form); update/delete stay operator-only
    // so drivers can read their assigned trips but never mutate them.
    app.save(reservations);
  },
  (app) => {
    const reservations = app.findCollectionByNameOrId("reservations");
    try {
      reservations.fields.removeByName("driver");
    } catch (_) {
      /* already absent */
    }
    reservations.listRule =
      "@request.auth.id != '' && (owner = @request.auth.id || centralOperator = @request.auth.id)";
    reservations.viewRule = reservations.listRule;
    app.save(reservations);

    try {
      const drivers = app.findCollectionByNameOrId("drivers");
      app.delete(drivers);
    } catch (e) {
      if (e.message && e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
