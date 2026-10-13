/// <reference path="../pb_data/types.d.ts" />

// Explicitly designate BJK LIMO RIDE BOOK (Limobjk@gmail.com) as the single
// central dashboard for ALL reservations from every connected business
// location (Alpine, Elite, Teterboro, Airport Car Service, etc.).
//
// Prior migrations (1791078000, 1791155600, 1791155900) set up the
// central-routing infrastructure (users.managedBy, reservations.centralOperator,
// owner||centralOperator access rules, and the reservation-central-operator
// hook) and designated successively "Alpine", "Elite", then the "primary
// (oldest) operator" as the hub. BJK is in fact the oldest operator, so
// 1791155900 already routed to it — but this delta makes the destination
// EXPLICIT and complete:
//
//   - Resolves BJK by email (Limobjk@gmail.com), falling back to the oldest
//     operator if the email is not found.
//   - Clears BJK's own managedBy (it is the hub, managed by no one).
//   - Force-links every OTHER operator's managedBy to BJK, so any future
//     operator accounts created via public sign-up route their bookings to
//     the BJK dashboard automatically (the hook reads managedBy).
//   - Stamps centralOperator = BJK on EVERY reservation (overwriting),
//     including BJK's own reservations that the hook left empty as
//     "redundant". This makes the consolidation explicit and complete —
//     every reservation is centrally owned by BJK regardless of which
//     source/business name it was booked under.
//
// Source names (reservations.sourceName), per-business settings, vehicle
// tiers, and owner-scoped access rules are unchanged. Only the central
// presentation destination is pinned to BJK.
migrate(
  (app) => {
    // Resolve BJK LIMO RIDE BOOK by email, falling back to the oldest operator.
    var bjk = null;
    try {
      bjk = app.findFirstRecordByFilter("users", 'email = "Limobjk@gmail.com"');
    } catch (err) {
      app.logger().error("bjk central: email lookup failed", "err", String(err));
    }
    if (!bjk) {
      try {
        var oldest = app.findRecordsByFilter("users", "id != ''", "created", 1, 0);
        if (oldest && oldest.length > 0) bjk = oldest[0];
      } catch (err) {
        app.logger().error("bjk central: oldest fallback failed", "err", String(err));
      }
    }

    if (!bjk) {
      try {
        app.logger().info("bjk central: no operator found; nothing to route");
      } catch (_) {}
      return;
    }

    var bjkId = bjk.id;

    // BJK is the hub: it is managed by no one.
    try {
      if (bjk.get("managedBy")) {
        bjk.set("managedBy", "");
        app.save(bjk);
      }
    } catch (err) {
      app.logger().error("bjk central: clear bjk managedBy failed", "err", String(err));
    }

    // Link every other operator to BJK so their new bookings route to the
    // BJK dashboard via the reservation-central-operator hook.
    try {
      var allUsers = app.findRecordsByFilter("users", "id != ''", "created", 500, 0);
      for (var i = 0; i < allUsers.length; i++) {
        var op = allUsers[i];
        if (op.id === bjkId) continue;
        var current = op.get("managedBy");
        var currentId = "";
        if (Array.isArray(current)) currentId = current[0] || "";
        else if (current) currentId = String(current);
        if (currentId !== bjkId) {
          op.set("managedBy", bjkId);
          app.save(op);
        }
      }
    } catch (err) {
      app.logger().error("bjk central: link operators failed", "err", String(err));
    }

    // Stamp centralOperator = BJK on EVERY reservation (overwrite) so the
    // consolidation is explicit and complete — every reservation from every
    // business location is centrally owned by the BJK dashboard.
    try {
      var rrows = app.findRecordsByFilter("reservations", "id != ''", "-created", 1000, 0);
      for (var r = 0; r < rrows.length; r++) {
        var rec = rrows[r];
        var existing = rec.get("centralOperator");
        var existingId = "";
        if (Array.isArray(existing)) existingId = existing[0] || "";
        else if (existing) existingId = String(existing);
        if (existingId !== bjkId) {
          rec.set("centralOperator", bjkId);
          app.save(rec);
        }
      }
    } catch (err) {
      app.logger().error("bjk central: stamp reservations failed", "err", String(err));
    }

    try {
      app.logger().info("bjk central dashboard configured", "bjk", bjkId);
    } catch (_) {}
  },
  (app) => {
    // Best-effort rollback: clear centralOperator on every reservation and
    // unlink operators, restoring the pre-centralization state.
    try {
      var rrows = app.findRecordsByFilter("reservations", "id != ''", "-created", 1000, 0);
      for (var r = 0; r < rrows.length; r++) {
        var rec = rrows[r];
        if (rec.get("centralOperator")) {
          rec.set("centralOperator", "");
          app.save(rec);
        }
      }
    } catch (err) {
      app.logger().error("bjk central down: clear reservations failed", "err", String(err));
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
      app.logger().error("bjk central down: unlink operators failed", "err", String(err));
    }
  },
);
