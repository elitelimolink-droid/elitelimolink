/// <reference path="../pb_data/types.d.ts" />

// Multi-business onboarding: when a new operator account is created (public
// sign-up), seed that operator's own dashboard with a default settings row
// and the three default vehicle categories — both scoped to the new owner.
// Every operator starts with an isolated, working dashboard and a live
// booking page (/?biz=<userId>) immediately after sign-up.
//
// Hook callbacks run in isolated JSVM scopes, so everything is defined inside
// the callback, and the whole body is wrapped so a seeding failure can never
// abort the account creation.
onRecordAfterCreateSuccess((e) => {
  try {
    const user = e.record;
    const ownerId = user.id;
    const displayName = String(user.get("name") || "").trim();
    const businessName = displayName || "My Chauffeur Service";

    // Default settings row for this operator only.
    const existingSettings = $app.findRecordsByFilter(
      "settings",
      "owner = {:owner}",
      "-created",
      1,
      0,
      { owner: ownerId },
    );
    if (!existingSettings || existingSettings.length === 0) {
      const settingsCol = $app.findCollectionByNameOrId("settings");
      const rec = new Record(settingsCol);
      rec.set("baseRate", 5);
      rec.set("minimumFare", 25);
      rec.set("perMileRate", 3.5);
      rec.set("hourlyRate", 65);
      rec.set("currency", "USD");
      rec.set("businessName", businessName);
      rec.set("dispatchEmail", "");
      rec.set("dispatchName", businessName + " Dispatch");
      rec.set("customerEmailEnabled", true);
      rec.set("fareVisible", false);
      rec.set("paymentRequired", true);
      rec.set("owner", ownerId);
      $app.save(rec);
    }

    // Default vehicle categories for this operator only.
    const tiers = [
      ["sedan", "Executive sedan", "A refined ride for everyday travel", 3, 25, 1, 3.5, 1],
      ["suv", "Premium SUV", "More space for people and luggage", 6, 45, 1.3, 4.5, 2],
      ["van", "Passenger van", "Travel together, comfortably", 8, 65, 1.6, 5.5, 3],
    ];
    for (var i = 0; i < tiers.length; i++) {
      var t = tiers[i];
      var existing = $app.findRecordsByFilter(
        "vehicle_tiers",
        "owner = {:owner} && key = {:key}",
        "sort",
        1,
        0,
        { owner: ownerId, key: t[0] },
      );
      if (existing && existing.length > 0) continue;
      var tierCol = $app.findCollectionByNameOrId("vehicle_tiers");
      var tier = new Record(tierCol);
      tier.set("key", t[0]);
      tier.set("name", t[1]);
      tier.set("detail", t[2]);
      tier.set("capacity", t[3]);
      tier.set("minFare", t[4]);
      tier.set("multiplier", t[5]);
      tier.set("perMileRate", t[6]);
      tier.set("active", true);
      tier.set("sort", t[7]);
      tier.set("owner", ownerId);
      $app.save(tier);
    }
  } catch (err) {
    $app.logger().error("operator onboarding seed failed", "err", String(err));
  }

  e.next();
}, "users");
