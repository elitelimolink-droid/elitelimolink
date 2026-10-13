/// <reference path="../pb_data/types.d.ts" />

// The previous backfill migration (1791555600) set `emailVisibility` and
// `updated` on existing drivers, but `created` stayed empty: PocketBase's
// autodate field re-derives `created` from the stored value on save (it has
// `onCreate: true, onUpdate: false`), so `record.set("created", ...)` is
// ignored when updating an existing record. The dashboard sorts drivers by
// `-created`, so an empty `created` leaves the record sorting incorrectly.
//
// Use a raw SQL UPDATE to write the timestamp directly into the column,
// bypassing the autodate prepare-value step. Future record saves preserve
// `created` (the field is not touched on update), so the value sticks.
migrate(
  (app) => {
    const now = new Date().toISOString();
    app
      .db()
      .newQuery("UPDATE drivers SET created = {:now} WHERE created = ''")
      .bind({ now: now })
      .execute();
  },
  (app) => {
    // Non-destructive down: the backfilled timestamp is an intentional
    // correction, not state to revert.
  },
);
