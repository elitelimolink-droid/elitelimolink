/// <reference path="../pb_data/types.d.ts" />

// Central dashboard routing: when a reservation is created, stamp
// `centralOperator` so the central (Elite Limo / BJK LIMO RIDE BOOK) control
// panel sees it alongside the owning operator.
//
// Resolution order:
//   1. The owner's `managedBy` link (set by the primary-central migration or
//      operator onboarding) — points at the operator who manages this owner.
//   2. Fallback: the PRIMARY (oldest) operator, so bookings from any operator
//      that has no managedBy link still land in the central control panel.
//      This guarantees ALL bookings from every business location are directed
//      to the Elite Limo control panel, per the operator's request.
//
// This is authoritative — any client-supplied centralOperator is ignored, so a
// public booking request can never route itself to an arbitrary operator. The
// owning operator still sees the reservation (owner rule). Only the
// reservation presentation is centralized; settings, vehicle tiers, and
// source names stay owner-scoped.
//
// Hook callbacks run in isolated JSVM scopes, so everything is defined inside
// the callback, and the body is wrapped so a lookup failure can never abort
// the reservation write.
onRecordCreateRequest((e) => {
  try {
    const r = e.record;
    const ownerVal = r.get("owner");
    let ownerId = "";
    if (Array.isArray(ownerVal)) ownerId = ownerVal[0] || "";
    else if (ownerVal) ownerId = String(ownerVal);

    let centralId = "";
    if (ownerId) {
      try {
        const op = $app.findRecordById("users", ownerId);
        if (op) {
          const mb = op.get("managedBy");
          if (Array.isArray(mb)) centralId = mb[0] || "";
          else if (mb) centralId = String(mb);
        }
      } catch (_) {
        // owner record not found — leave centralId empty for now; the
        // primary fallback below still routes the booking centrally.
      }
    }

    // Fallback: route to the primary (oldest) operator so every booking from
    // every business location reaches the central control panel even when the
    // owner has no managedBy link.
    if (!centralId) {
      try {
        const primary = $app.findRecordsByFilter("users", "id != ''", "created", 1, 0);
        if (primary && primary.length > 0) {
          const primaryId = primary[0].id;
          // Don't redundantly stamp the primary's own reservations (the owner
          // rule already grants access); leave it empty for self-owned rows.
          if (primaryId && primaryId !== ownerId) centralId = primaryId;
        }
      } catch (_) {
        // no operators — leave centralOperator empty
      }
    }

    r.set("centralOperator", centralId || "");
  } catch (err) {
    $app.logger().error("central-operator hook failed", "err", String(err));
  }

  e.next();
}, "reservations");
