/// <reference path="../pb_data/types.d.ts" />

// Universal central routing: designate the PRIMARY (oldest) operator as the
// central control-panel hub and route EVERY reservation to it, so all bookings
// from every business location land in the Elite Limo / BJK LIMO RIDE BOOK
// control panel regardless of which operator owns them.
//
// The earlier name-matched migrations (1791078000, 1791155600) only linked
// operators whose businessName contained "alpine"/"elite"/"airport car
// service" and required >=2 matched businesses. In practice there is a single
// operator running multiple source names, so those matched <2 businesses and
// did nothing — centralOperator was never stamped.
//
// This delta makes centralization universal and explicit:
//   - The primary (oldest) operator is the central hub.
//   - Every OTHER operator's `managedBy` is force-set to the primary operator
//     (overwriting any prior link), so the reservation-central-operator hook
//     routes their new bookings to the primary. The primary's own managedBy
//     is cleared (it is the hub).
//   - Every existing reservation gets `centralOperator` stamped to the
//     primary operator (overwriting), so the primary dashboard sees all
//     historical reservations too. Primary-owned reservations get
//     centralOperator = primary (redundant but harmless — the owner rule
//     already grants access).
//
// Source names, per-business settings, vehicle tiers, and owner-scoped access
// rules are unchanged. Only reservation presentation is centralized: each
// owner still sees only their own reservations (owner rule), and the primary
// operator additionally sees every operator's reservations (centralOperator
// rule).
migrate(
  (app) => {
    // Resolve the primary (oldest) operator.
    var primary = null;
    try {
      var users = app.findRecordsByFilter("users", "id != ''", "created", 1, 0);
      if (users && users.length > 0) primary = users[0];
    } catch (err) {
      app.logger().error("primary central: find users failed", "err", String(err));
    }

    if (!primary) {
      try {
        app.logger().info("primary central: no operators found; nothing to route");
      } catch (_) {}
      return;
    }

    var primaryId = primary.id;

    // The primary operator is the hub: it is not managed by anyone.
    try {
      if (primary.get("managedBy")) {
        primary.set("managedBy", "");
        app.save(primary);
      }
    } catch (err) {
      app.logger().error(
        "primary central: clear primary managedBy failed",
        "err",
        String(err),
      );
    }

    // Link every other operator to the primary operator.
    try {
      var allUsers = app.findRecordsByFilter("users", "id != ''", "created", 500, 0);
      for (var i = 0; i < allUsers.length; i++) {
        var op = allUsers[i];
        if (op.id === primaryId) continue;
        var current = op.get("managedBy");
        var currentId = "";
        if (Array.isArray(current)) currentId = current[0] || "";
        else if (current) currentId = String(current);
        if (currentId !== primaryId) {
          op.set("managedBy", primaryId);
          app.save(op);
        }
      }
    } catch (err) {
      app.logger().error("primary central: link operators failed", "err", String(err));
    }

    // Stamp centralOperator = primary on every reservation (overwrite) so the
    // primary dashboard sees all history. Primary-owned reservations become
    // centralOperator = primary (redundant but harmless).
    try {
      var rrows = app.findRecordsByFilter(
        "reservations",
        "id != ''",
        "-created",
        1000,
        0,
      );
      for (var r = 0; r < rrows.length; r++) {
        var rec = rrows[r];
        var existing = rec.get("centralOperator");
        var existingId = "";
        if (Array.isArray(existing)) existingId = existing[0] || "";
        else if (existing) existingId = String(existing);
        if (existingId !== primaryId) {
          rec.set("centralOperator", primaryId);
          app.save(rec);
        }
      }
    } catch (err) {
      app.logger().error("primary central: stamp reservations failed", "err", String(err));
    }

    try {
      app.logger().info("primary central configured", "primary", primaryId);
    } catch (_) {}
  },
  (app) => {
    // Best-effort rollback: clear centralOperator on every reservation and
    // unlink operators, restoring the pre-centralization state.
    try {
      var rrows = app.findRecordsByFilter(
        "reservations",
        "id != ''",
        "-created",
        1000,
        0,
      );
      for (var r = 0; r < rrows.length; r++) {
        var rec = rrows[r];
        if (rec.get("centralOperator")) {
          rec.set("centralOperator", "");
          app.save(rec);
        }
      }
    } catch (err) {
      app.logger().error("primary central down: clear reservations failed", "err", String(err));
    }

    try {
      var allUsers = app.findRecordsByFilter("users", "id != ''", "created", 500, 0);
      for (var i = 0; i < allUsers.length; i++) {
        var op = allUsers[i];
        if (op.get("managedBy")) {
          op.set("managedBy", "");
          app.save(op);
        }
      }
    } catch (err) {
      app.logger().error("primary central down: unlink operators failed", "err", String(err));
    }
  },
);
