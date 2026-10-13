import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, data, useSearchParams, useNavigate, redirect, UNSAFE_withHydrateFallbackProps, Link } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { useEffect, useState, useId, useRef, useMemo } from "react";
import PocketBase, { ClientResponseError } from "pocketbase";
import { Search, Check, Plane, MapPin, CarFront, Clock3, UserRound, CalendarDays, ChevronRight, StickyNote, Baby, DoorOpen, Repeat2, X, UsersRound, Loader2, ArrowLeft, ArrowRight, LockKeyhole, Percent, CreditCard, TriangleAlert, Lock, ShieldCheck, SunMoon, Sun, Moon, MailCheck, UserPlus, Compass, SunMedium, Radio, LogOut, Sparkles, CheckCircle2, Settings, MessageSquare, RefreshCw, User, Clock, Navigation, Users, Phone, UserCheck, Flag, Save, Menu, Calendar, HandCoins, Trash2, Settings2, Eye, CircleDollarSign, Mail, ImageUp, KeyRound, Link2, Copy, Power, Gauge, Building, Square, Play, CalendarPlus, Edit3, Globe, ExternalLink, MousePointerClick, Smartphone, Tablet, Monitor, Volume2, VolumeX, Bell, Filter, Building2, ChevronDown, Plus, Inbox, MoreVertical, XCircle } from "lucide-react";
import ipaddr from "ipaddr.js";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import crypto, { randomBytes } from "node:crypto";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders
    });
  }
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const stylesheet = "/assets/index-a0kJggcf.css";
const LOCAL_HOSTNAMES = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);
const siteOrigin = (request) => {
  const { host, hostname } = new URL(request.url);
  return `${LOCAL_HOSTNAMES.has(hostname) ? "http" : "https"}://${host}`;
};
function HorizonsPreviewScripts() {
  useEffect(() => {
    window.__horizonsHydrated = true;
    window.dispatchEvent(new Event("horizons:hydrated"));
    {
      void import("./assets/_virtual_horizons-runtime-B5-KaiEE.js");
    }
  }, []);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    null,
    null
  ] });
}
const links = () => [{
  rel: "stylesheet",
  href: stylesheet
}, {
  rel: "stylesheet",
  href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
}, {
  rel: "icon",
  href: "/favicon.ico",
  sizes: "32x32"
}, {
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}];
function loader$g({
  request
}) {
  const origin = siteOrigin(request);
  return data({
    origin
  }, {
    headers: {
      Link: `<${origin}/sitemap.xml>; rel="sitemap"; type="application/xml"`
    }
  });
}
function headers({
  loaderHeaders
}) {
  return loaderHeaders;
}
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    suppressHydrationWarning: true,
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx("script", {
        dangerouslySetInnerHTML: {
          __html: "(function(){try{var K='theme';var s=localStorage.getItem(K);var mode=(s==='light'||s==='dark')?s:'auto';var root=document.documentElement;root.setAttribute('data-theme-mode',mode);var mq=window.matchMedia('(prefers-color-scheme: dark)');function isDark(){return mode==='auto'?mq.matches:mode==='dark';}root.classList.toggle('dark',isDark());mq.addEventListener('change',function(){var m=root.getAttribute('data-theme-mode')||'auto';if(m==='auto'){root.classList.toggle('dark',mq.matches);}});}catch(e){}})();"
        }
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {}), /* @__PURE__ */ jsx(HorizonsPreviewScripts, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [/* @__PURE__ */ jsx("div", {
        id: "root",
        children
      }), /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), null]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  headers,
  links,
  loader: loader$g
}, Symbol.toStringTag, { value: "Module" }));
const POCKETBASE_API_URL = "/hcgi/platform";
const pocketbaseClient = new PocketBase(POCKETBASE_API_URL);
const ROOT_ROUTE_ID = "root";
const siteOriginFrom = (matches) => {
  const root2 = matches.find((match) => match?.id === ROOT_ROUTE_ID);
  return root2?.loaderData?.origin ?? "";
};
const absoluteUrl = (origin, target) => {
  if (/^https?:\/\//.test(target)) {
    return target;
  }
  return `${origin}${target.startsWith("/") ? target : `/${target}`}`;
};
function seo({ matches, location }, input) {
  const origin = siteOriginFrom(matches);
  const canonical = absoluteUrl(origin, input.path ?? location.pathname);
  const imageUrl = input.image ? absoluteUrl(origin, input.image) : "";
  const tags = [
    { title: input.title },
    { name: "description", content: input.description },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:type", content: input.type ?? "website" },
    { name: "twitter:card", content: imageUrl ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description }
  ];
  if (origin) {
    tags.push({ tagName: "link", rel: "canonical", href: canonical }, { property: "og:url", content: canonical });
  }
  if (imageUrl) {
    tags.push({ property: "og:image", content: imageUrl }, { name: "twitter:image", content: imageUrl });
  }
  if (input.noindex) {
    tags.push({ name: "robots", content: "noindex" });
  }
  for (const block of [input.jsonLd ?? []].flat()) {
    tags.push({ "script:ld+json": block });
  }
  return tags;
}
const logger = {
  // Application errors - goes to stdout
  error: (...args) => {
    console.log("[ERROR]", ...args);
  },
  // Critical system errors - goes to stderr
  fatal: (...args) => {
    console.error("[FATAL]", ...args);
  },
  info: (...args) => {
    console.log("[INFO]", ...args);
  },
  debug: (...args) => {
    console.log("[DEBUG]", ...args);
  },
  warn: (...args) => {
    console.log("[WARN]", ...args);
  }
};
const HEALTH_RETRIES = 10;
const HEALTH_RETRY_DELAY_MS = 1e3;
const SUPERUSERS_COLLECTION = "_superusers";
const pocketbaseUrl = () => process.env.POCKETBASE_URL || "http://localhost:8090";
const pb = new PocketBase(pocketbaseUrl());
pb.autoCancellation(false);
let authPromise = null;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const waitForHealth = async () => {
  for (let attempt = 1; attempt <= HEALTH_RETRIES; attempt += 1) {
    try {
      await pb.health.check();
      return;
    } catch {
    }
    logger.warn(`PocketBase not ready, retrying (${attempt}/${HEALTH_RETRIES})...`);
    await sleep(HEALTH_RETRY_DELAY_MS);
  }
  throw new Error(`PocketBase health check failed after ${HEALTH_RETRIES} retries`);
};
const authenticate = async () => {
  const identity = process.env.PB_SUPERUSER_EMAIL;
  const password = process.env.PB_SUPERUSER_PASSWORD;
  if (!identity || !password) {
    throw new Error("PB_SUPERUSER_EMAIL / PB_SUPERUSER_PASSWORD are not set — is PocketBase enabled?");
  }
  await waitForHealth();
  await pb.collection(SUPERUSERS_COLLECTION).authWithPassword(identity, password);
};
const ensureAuth = async () => {
  if (pb.authStore.isValid) {
    return;
  }
  if (!authPromise) {
    authPromise = authenticate().finally(() => {
      authPromise = null;
    });
  }
  return authPromise;
};
const withFreshToken = async (request) => {
  await ensureAuth();
  try {
    return await request();
  } catch (error) {
    if (!(error instanceof ClientResponseError) || error.status !== 401) {
      throw error;
    }
    pb.authStore.clear();
    await ensureAuth();
    return request();
  }
};
const splitListQuery = ({ page, perPage, ...options }) => ({
  page: Number(page ?? 1),
  perPage: Number(perPage ?? 30),
  options
});
const pocketbaseAdmin = {
  listRecords: (collection, query = {}) => {
    const { page, perPage, options } = splitListQuery(query);
    return withFreshToken(() => pb.collection(collection).getList(page, perPage, options));
  },
  getRecord: (collection, id, query = {}) => withFreshToken(() => pb.collection(collection).getOne(id, query)),
  createRecord: (collection, data2) => withFreshToken(() => pb.collection(collection).create(data2)),
  /** One transaction, so a failure part-way through leaves nothing written. */
  createRecords: async (collection, records) => {
    const batch = pb.createBatch();
    records.forEach((record) => batch.collection(collection).create(record));
    await withFreshToken(() => batch.send());
  },
  updateRecord: (collection, id, data2) => withFreshToken(() => pb.collection(collection).update(id, data2)),
  deleteRecord: async (collection, id) => {
    await withFreshToken(() => pb.collection(collection).delete(id));
  },
  /** Short-lived token that grants read access to files in protected collections. */
  getFileToken: () => withFreshToken(() => pb.files.getToken()),
  /**
   * Escape hatch for endpoints the SDK has no method for — a custom route added
   * with `routerAdd` in `apps/pocketbase/pb_hooks`. Everything PocketBase ships
   * itself is covered above or by the SDK; reach for those first.
   */
  send: (path, init = {}) => withFreshToken(() => pb.send(path, init))
};
const DEFAULT_PRICING = {
  baseRate: 5,
  minimumFare: 25,
  perMileRate: 3.5,
  hourlyRate: 65,
  currency: "USD",
  tipEnabled: false,
  tipPercent: 15,
  taxEnabled: false,
  taxPercent: 0,
  tollsEnabled: false,
  fareVisible: true,
  paymentRequired: true,
  carSeatPrice: 0,
  extraStopPrice: 0,
  insidePickupPrice: 0,
  minAdvanceHours: 2
};
const DEFAULT_TIERS = [
  { key: "sedan", name: "Executive sedan", detail: "A refined ride for everyday travel", capacity: 3, minFare: 25, multiplier: 1, perMileRate: 0, active: true, sort: 1 },
  { key: "suv", name: "Premium SUV", detail: "More space for people and luggage", capacity: 6, minFare: 45, multiplier: 1.3, perMileRate: 0, active: true, sort: 2 },
  { key: "van", name: "Passenger van", detail: "Travel together, comfortably", capacity: 8, minFare: 65, multiplier: 1.6, perMileRate: 0, active: true, sort: 3 }
];
function estimateRideFare(settings, distanceMiles, tier) {
  const multiplier = tier?.multiplier && tier.multiplier > 0 ? tier.multiplier : 1;
  const basePerMile = Number(settings.perMileRate) > 0 ? Number(settings.perMileRate) : DEFAULT_PRICING.perMileRate;
  const tierPerMile = tier?.perMileRate && tier.perMileRate > 0 ? tier.perMileRate : basePerMile * multiplier;
  const tierBaseRate = tier?.minFare !== void 0 && tier.minFare !== null && tier.minFare > 0 ? tier.minFare : Number(settings.baseRate) || 0;
  const raw = tierBaseRate + tierPerMile * Math.max(0, distanceMiles);
  const floor = tierBaseRate > 0 ? tierBaseRate : settings.minimumFare ?? 0;
  return Math.max(floor, raw);
}
function estimateHourlyFare(settings, hours, tier) {
  const multiplier = tier?.multiplier && tier.multiplier > 0 ? tier.multiplier : 1;
  const raw = (Number(settings.hourlyRate) || DEFAULT_PRICING.hourlyRate) * Math.max(0, hours) * multiplier;
  const floor = Math.max(tier?.minFare ?? 0, settings.minimumFare ?? 0);
  return Math.max(floor, raw);
}
function formatFare(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}
function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
const NO_TIP = { kind: "none", percent: 0, amount: 0 };
function buildFareBreakdown(settings, subtotal, tolls, tipOverride, addons) {
  const useTolls = settings.tollsEnabled ? Math.max(0, tolls) : 0;
  const carSeatAmount = addons?.carSeat ? Math.max(0, settings.carSeatPrice ?? 0) : 0;
  const extraStopAmount = addons?.extraStop ? Math.max(0, settings.extraStopPrice ?? 0) : 0;
  const insidePickupAmount = addons?.insidePickup ? Math.max(0, settings.insidePickupPrice ?? 0) : 0;
  const addonsTotal = round2(carSeatAmount + extraStopAmount + insidePickupAmount);
  let tipAmount = 0;
  if (tipOverride && tipOverride.kind !== "none") {
    if (tipOverride.kind === "amount" && tipOverride.amount > 0) {
      tipAmount = tipOverride.amount;
    } else if (tipOverride.kind === "percent" && tipOverride.percent > 0) {
      tipAmount = subtotal * (Math.max(0, tipOverride.percent) / 100);
    }
  } else if (settings.tipEnabled) {
    tipAmount = subtotal * (Math.max(0, settings.tipPercent) / 100);
  }
  tipAmount = round2(tipAmount);
  const taxAmount = settings.taxEnabled ? round2((subtotal + addonsTotal + useTolls) * (Math.max(0, settings.taxPercent) / 100)) : 0;
  const total = round2(subtotal + addonsTotal + useTolls + tipAmount + taxAmount);
  return {
    subtotal: round2(subtotal),
    tollAmount: round2(useTolls),
    tipAmount,
    taxAmount,
    total,
    carSeatAmount: round2(carSeatAmount),
    extraStopAmount: round2(extraStopAmount),
    insidePickupAmount: round2(insidePickupAmount)
  };
}
const PB_PUBLIC_URL$2 = "/hcgi/platform";
const tierPhotoUrl$2 = (id, photo) => id && photo ? `${PB_PUBLIC_URL$2}/api/files/vehicle_tiers/${id}/${photo}` : "";
function normalizeBizId$3(raw) {
  const value = (raw ?? "").trim();
  return /^[a-z0-9]{15}$/.test(value) ? value : "";
}
async function resolveBusinessId(rawIdOrSlug, hostHeader) {
  const raw = (rawIdOrSlug ?? "").trim();
  if (/^[a-z0-9]{15}$/.test(raw)) {
    return raw;
  }
  const slug = raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const host = (hostHeader || "").toLowerCase();
  try {
    const users = await pocketbaseAdmin.listRecords("users", {
      perPage: 100,
      sort: "created"
    });
    if (slug && slug !== "elitelimolink" && slug !== "home") {
      const match = users.items.find((u) => {
        const uName = (u.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const uEmail = (u.email || "").toLowerCase();
        return uName === slug || uName.includes(slug) || slug.includes(uName) || uEmail.includes(slug);
      });
      if (match) return match.id;
      try {
        const settings = await pocketbaseAdmin.listRecords("settings", {
          perPage: 100
        });
        const settingMatch = settings.items.find((s) => {
          const sName = (s.businessName || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          return sName === slug || sName.includes(slug) || slug.includes(sName);
        });
        if (settingMatch && settingMatch.owner) return settingMatch.owner;
      } catch {
      }
    }
    if (host && !host.includes("elitelimolink") && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      const domainClean = host.split(":")[0].split(".")[0].replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const domainAlnum = domainClean.replace(/-/g, "");
      const match = users.items.find((u) => {
        const uName = (u.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const uAlnum = uName.replace(/-/g, "");
        const uEmail = (u.email || "").toLowerCase();
        return domainClean.includes(uName) || uName.includes(domainClean) || domainAlnum.includes(uAlnum) || uAlnum.includes(domainAlnum) || uEmail.includes(domainClean);
      });
      if (match) return match.id;
    }
    const primary = users.items.find((u) => !u.managedBy || Array.isArray(u.managedBy) && u.managedBy.length === 0);
    return primary ? primary.id : users.items[0]?.id ?? "";
  } catch {
    return "";
  }
}
function clampAdvanceHours$2(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_PRICING.minAdvanceHours;
  return Math.min(24, Math.max(1, Math.round(n)));
}
async function loadBusinessPricing(bizId) {
  let record = null;
  let owner = "";
  try {
    if (bizId) {
      const result = await pocketbaseAdmin.listRecords("settings", {
        perPage: 1,
        sort: "-updated,-created",
        filter: `owner = "${bizId}"`
      });
      record = result.items[0] ?? null;
      owner = bizId;
    } else {
      const result = await pocketbaseAdmin.listRecords("settings", {
        perPage: 1,
        sort: "-updated,-created"
      });
      record = result.items[0] ?? null;
      owner = record?.owner ?? "";
    }
  } catch {
    record = null;
  }
  const pricing = record ? {
    baseRate: record.baseRate ?? DEFAULT_PRICING.baseRate,
    minimumFare: record.minimumFare ?? DEFAULT_PRICING.minimumFare,
    perMileRate: record.perMileRate ?? DEFAULT_PRICING.perMileRate,
    hourlyRate: record.hourlyRate ?? DEFAULT_PRICING.hourlyRate,
    currency: record.currency ?? DEFAULT_PRICING.currency,
    tipEnabled: !!record.tipEnabled,
    tipPercent: record.tipPercent ?? DEFAULT_PRICING.tipPercent,
    taxEnabled: !!record.taxEnabled,
    taxPercent: record.taxPercent ?? DEFAULT_PRICING.taxPercent,
    tollsEnabled: !!record.tollsEnabled,
    fareVisible: record.fareVisible !== false,
    paymentRequired: record.paymentRequired !== false,
    carSeatPrice: record.carSeatPrice ?? DEFAULT_PRICING.carSeatPrice,
    extraStopPrice: record.extraStopPrice ?? DEFAULT_PRICING.extraStopPrice,
    insidePickupPrice: record.insidePickupPrice ?? DEFAULT_PRICING.insidePickupPrice,
    minAdvanceHours: clampAdvanceHours$2(record.minAdvanceHours)
  } : DEFAULT_PRICING;
  let tiers = DEFAULT_TIERS;
  if (owner) {
    try {
      const result = await pocketbaseAdmin.listRecords("vehicle_tiers", {
        sort: "sort",
        perPage: 50,
        filter: `owner = "${owner}"`
      });
      if (result.items.length) {
        tiers = result.items.filter((r) => r.active !== false).map((r) => ({
          key: r.key ?? "",
          name: r.name ?? r.key ?? "",
          detail: r.detail ?? "",
          capacity: r.capacity ?? 3,
          minFare: r.minFare ?? 0,
          multiplier: r.multiplier ?? 1,
          perMileRate: r.perMileRate ?? 0,
          active: r.active !== false,
          sort: r.sort ?? 0,
          photo: tierPhotoUrl$2(r.id, r.photo)
        }));
      }
    } catch {
      tiers = DEFAULT_TIERS;
    }
  }
  return { pricing, tiers, businessName: record?.businessName ?? "", owner, hasSettings: Boolean(record) };
}
async function loadBusinessNameByReservation(reservationId) {
  if (!reservationId) return loadPrimaryBusinessName();
  try {
    const reservation = await pocketbaseAdmin.getRecord("reservations", reservationId);
    const ownerId = normalizeBizId$3(reservation.owner);
    if (ownerId) {
      const { businessName } = await loadBusinessPricing(ownerId);
      if (businessName) return businessName;
    }
  } catch {
  }
  return loadPrimaryBusinessName();
}
async function loadPrimaryBusinessName() {
  try {
    const { businessName } = await loadBusinessPricing("");
    return businessName;
  } catch {
    return "";
  }
}
const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show"
];
function normalizeStatus(value) {
  return RESERVATION_STATUSES.includes(String(value ?? "")) ? value : "pending";
}
const vehicles = [
  { id: "sedan", name: "Executive sedan", detail: "A refined ride for everyday travel", capacity: 3 },
  { id: "suv", name: "Premium SUV", detail: "More space for people and luggage", capacity: 6 },
  { id: "van", name: "Passenger van", detail: "Travel together, comfortably", capacity: 8 }
];
function dateTime(date, time) {
  return /* @__PURE__ */ new Date(`${date}T${time}:00`);
}
function compareByPickup(a, b) {
  const now = Date.now();
  const ta = a.pickupAt ? new Date(a.pickupAt).getTime() : NaN;
  const tb = b.pickupAt ? new Date(b.pickupAt).getTime() : NaN;
  const upcomingA = !Number.isNaN(ta) && ta >= now;
  const upcomingB = !Number.isNaN(tb) && tb >= now;
  if (upcomingA && upcomingB) return ta - tb;
  if (upcomingA) return -1;
  if (upcomingB) return 1;
  if (!Number.isNaN(ta) && !Number.isNaN(tb)) return tb - ta;
  if (!Number.isNaN(ta)) return -1;
  if (!Number.isNaN(tb)) return 1;
  return (b.created ?? "").localeCompare(a.created ?? "");
}
function formatTripDate(date, time) {
  if (!date || !time) return "Choose a date and time";
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(dateTime(date, time));
}
const FALLBACK = {
  ...DEFAULT_PRICING,
  vehicleTiers: DEFAULT_TIERS,
  mapsConfigured: false,
  squareConfigured: false,
  squareAppId: "",
  squareLocationId: "",
  squareEnvironment: "production",
  hasSettings: false,
  bizId: "",
  businessName: ""
};
function usePricing(biz) {
  const [pricing, setPricing] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    let attempt = 0;
    let timer;
    let recoveryTimer;
    const load = () => {
      attempt += 1;
      fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ biz: biz ?? "" }),
        cache: "no-store"
      }).then((res) => {
        if (!res.ok) throw new Error(`pricing ${res.status}`);
        return res.json();
      }).then((data2) => {
        if (!active) return;
        setPricing({
          ...DEFAULT_PRICING,
          ...data2,
          vehicleTiers: data2.vehicleTiers && data2.vehicleTiers.length ? data2.vehicleTiers : DEFAULT_TIERS,
          mapsConfigured: !!data2.mapsConfigured,
          squareConfigured: !!data2.squareConfigured,
          squareAppId: data2.squareAppId ?? "",
          squareLocationId: data2.squareLocationId ?? "",
          squareEnvironment: data2.squareEnvironment === "sandbox" ? "sandbox" : "production",
          hasSettings: !!data2.hasSettings,
          bizId: data2.bizId ?? "",
          businessName: data2.businessName ?? ""
        });
        setLoaded(true);
        setError(false);
        setLoading(false);
        if (recoveryTimer) {
          window.clearTimeout(recoveryTimer);
          recoveryTimer = void 0;
        }
      }).catch(() => {
        if (!active) return;
        if (attempt < 5) {
          timer = window.setTimeout(load, 600 * attempt);
        } else {
          setError(true);
          setLoading(false);
          recoveryTimer = window.setTimeout(() => {
            attempt = 0;
            load();
          }, 8e3);
        }
      });
    };
    load();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        attempt = 0;
        if (recoveryTimer) {
          window.clearTimeout(recoveryTimer);
          recoveryTimer = void 0;
        }
        load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
      if (recoveryTimer) window.clearTimeout(recoveryTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [biz]);
  return { pricing, loading, loaded, error };
}
function LocationField({ value, onChange, onCoords, placeholder, ariaLabel, marker }) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [outOfArea, setOutOfArea] = useState(false);
  const listId = useId();
  const blurTimer = useRef(void 0);
  const verifyController = useRef(null);
  const fetchController = useRef(null);
  const inputRef = useRef(null);
  const skipBlurVerify = useRef(false);
  const chosenCoords = useRef(null);
  useEffect(() => {
    setQuery(value);
    if (!value) {
      setVerified(false);
      setSuggestions([]);
      setActiveIndex(-1);
      chosenCoords.current = null;
    }
  }, [value]);
  useEffect(() => {
    if (!focused || query.trim().length < 2) {
      setSuggestions([]);
      setActiveIndex(-1);
      setLoading(false);
      setOutOfArea(false);
      return;
    }
    setLoading(true);
    setError(false);
    if (fetchController.current) fetchController.current.abort();
    const controller = new AbortController();
    fetchController.current = controller;
    const debounce = window.setTimeout(() => {
      fetch(`/api/places-autocomplete?input=${encodeURIComponent(query.trim())}`, { signal: controller.signal }).then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      }).then((data2) => {
        setSuggestions(data2.suggestions ?? []);
        setOutOfArea(Boolean(data2.outOfArea));
        setActiveIndex(-1);
      }).catch((err) => {
        if (err?.name === "AbortError") return;
        setSuggestions([]);
        setError(true);
      }).finally(() => setLoading(false));
    }, 200);
    return () => {
      window.clearTimeout(debounce);
      controller.abort();
    };
  }, [query, focused]);
  function verify(address) {
    if (verifyController.current) verifyController.current.abort();
    if (address.trim().length < 5) {
      setVerified(false);
      return;
    }
    setVerifying(true);
    const controller = new AbortController();
    verifyController.current = controller;
    fetch(`/api/geocode?address=${encodeURIComponent(address)}`, { signal: controller.signal }).then((res) => res.json()).then((data2) => {
      if (controller.signal.aborted) return;
      const ok = Boolean(data2.verified && data2.formattedAddress);
      setVerified(ok);
      if (ok && typeof data2.lat === "number" && typeof data2.lng === "number") {
        chosenCoords.current = { lat: data2.lat, lng: data2.lng };
        onCoords?.({ lat: data2.lat, lng: data2.lng });
      } else if (!ok && !chosenCoords.current) {
        onCoords?.(null);
      }
    }).catch(() => {
      setVerified(false);
      if (!chosenCoords.current) onCoords?.(null);
    }).finally(() => setVerifying(false));
  }
  function choose(s) {
    setQuery(s.description);
    onChange(s.description);
    const coords = typeof s.lat === "number" && typeof s.lng === "number" ? { lat: s.lat, lng: s.lng } : null;
    chosenCoords.current = coords;
    onCoords?.(coords);
    setSuggestions([]);
    setActiveIndex(-1);
    setVerified(false);
    verify(s.description);
    skipBlurVerify.current = true;
    inputRef.current?.blur();
  }
  function clearBlur() {
    blurTimer.current = window.setTimeout(() => {
      setFocused(false);
      setSuggestions([]);
      setActiveIndex(-1);
      if (!skipBlurVerify.current && query.trim().length >= 5) {
        verify(query.trim());
      }
      skipBlurVerify.current = false;
    }, 180);
  }
  function cancelBlur() {
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
  }
  const showList = focused && suggestions.length > 0;
  function onKeyDown(e) {
    if (!showList && e.key !== "Escape") return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => i <= 0 ? suggestions.length - 1 : i - 1);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        choose(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        e.preventDefault();
        choose(suggestions[0]);
      }
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setActiveIndex(-1);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "field-row booking-row", style: { position: "relative", flexDirection: "column", alignItems: "stretch", gap: 0, padding: 0, height: "auto" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "13px", minHeight: "53px", padding: "0 17px", width: "100%" }, children: [
      marker === "pickup" ? /* @__PURE__ */ jsx("span", { className: "pickup-marker" }) : marker === "stop" ? /* @__PURE__ */ jsx("span", { className: "stop-marker" }) : /* @__PURE__ */ jsx("span", { className: "dropoff-marker" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: inputRef,
          value: query,
          onChange: (e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setVerified(false);
            chosenCoords.current = null;
            onCoords?.(null);
          },
          onFocus: () => {
            setFocused(true);
          },
          onBlur: clearBlur,
          onKeyDown,
          placeholder,
          "aria-label": ariaLabel,
          "aria-autocomplete": "list",
          "aria-expanded": showList,
          "aria-controls": showList ? listId : void 0,
          "aria-activedescendant": showList && activeIndex >= 0 ? `${listId}-${activeIndex}` : void 0,
          maxLength: 300,
          style: { flex: 1, minWidth: 0, background: "transparent", outline: "none", border: 0, color: "var(--ink)", height: "50px" }
        }
      ),
      verifying ? /* @__PURE__ */ jsx(Search, { size: 16, className: "row-end", style: { animation: "spin 1s linear infinite" } }) : verified ? /* @__PURE__ */ jsxs("span", { className: "verified-badge", title: "Address verified", children: [
        /* @__PURE__ */ jsx(Check, { size: 15, strokeWidth: 3 }),
        " Verified"
      ] }) : loading ? /* @__PURE__ */ jsx(Search, { size: 16, className: "row-end", style: { animation: "spin 1s linear infinite" } }) : null
    ] }),
    showList && /* @__PURE__ */ jsx("ul", { id: listId, role: "listbox", "aria-label": ariaLabel, className: "autocomplete-list", onMouseDown: (e) => e.preventDefault(), children: suggestions.map((s, i) => /* @__PURE__ */ jsx("li", { id: `${listId}-${i}`, role: "option", "aria-selected": i === activeIndex, children: /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        className: `autocomplete-item ${i === activeIndex ? "active" : ""}`,
        onMouseDown: () => choose(s),
        onMouseEnter: () => {
          cancelBlur();
          setActiveIndex(i);
        },
        onMouseLeave: () => setActiveIndex(-1),
        onFocus: cancelBlur,
        children: [
          /* @__PURE__ */ jsx("span", { className: "autocomplete-icon", children: s.type === "airport" ? /* @__PURE__ */ jsx(Plane, { size: 16 }) : /* @__PURE__ */ jsx(MapPin, { size: 16 }) }),
          /* @__PURE__ */ jsxs("span", { className: "autocomplete-copy", children: [
            /* @__PURE__ */ jsx("strong", { children: s.main || s.description }),
            s.secondary && /* @__PURE__ */ jsx("small", { children: s.secondary })
          ] })
        ]
      }
    ) }, `${s.placeId || s.description}-${i}`)) }),
    focused && query.trim().length >= 2 && !loading && suggestions.length === 0 && !error && /* @__PURE__ */ jsx("div", { className: "autocomplete-hint", children: outOfArea ? "We currently serve the New York, New Jersey, and Connecticut area only. Please enter an address within our service area." : "No matching address in our service area (New York, New Jersey, Connecticut). Type the house number, street, city, and state, or pick a suggestion. Airport names like LaGuardia still work." }),
    focused && error && /* @__PURE__ */ jsx("div", { className: "autocomplete-hint", style: { color: "#b5333b", background: "#fdeeee", borderColor: "#f3d2d4" }, children: "Couldn’t load address suggestions. Check your connection and try again." })
  ] });
}
const TRAFFIC_COLORS = {
  free: "#2f9e54",
  slow: "#e8a317",
  heavy: "#d23b3b"
};
function RouteMap({
  origin,
  destination,
  waypoint,
  variant = "inline",
  originCoords,
  destinationCoords,
  waypointCoords
}) {
  const mapId = useId().replace(/:/g, "");
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const lineRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const leafletRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Loading route map…");
  const [meta2, setMeta] = useState(null);
  const [traffic, setTraffic] = useState({ state: "unavailable", segments: [] });
  const stop = waypoint?.trim() ?? "";
  useEffect(() => {
    if (!origin || !destination) return;
    let cancelled = false;
    const params = new URLSearchParams({ origin, destination });
    if (stop) params.set("waypoint", stop);
    if (originCoords) {
      params.set("originLat", String(originCoords.lat));
      params.set("originLng", String(originCoords.lng));
    }
    if (destinationCoords) {
      params.set("destinationLat", String(destinationCoords.lat));
      params.set("destinationLng", String(destinationCoords.lng));
    }
    if (stop && waypointCoords) {
      params.set("waypointLat", String(waypointCoords.lat));
      params.set("waypointLng", String(waypointCoords.lng));
    }
    setStatus("loading");
    setMessage("Loading route map…");
    setMeta(null);
    setTraffic({ state: "unavailable", segments: [] });
    if (trafficLayerRef.current) trafficLayerRef.current.clearLayers();
    (async () => {
      try {
        const res = await fetch(`/api/route-data?${params.toString()}`);
        if (!res.ok) throw new Error(`route-data ${res.status}`);
        const data2 = await res.json();
        if (cancelled) return;
        if (!data2.ok || !data2.origin || !data2.destination || data2.polyline.length < 2) {
          setStatus("error");
          setMessage(data2.error || "Map unavailable for these locations.");
          return;
        }
        const L = await import("leaflet");
        leafletRef.current = L;
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
        });
        if (!containerRef.current) return;
        if (!mapRef.current) {
          const map2 = L.map(containerRef.current, {
            zoomControl: false,
            attributionControl: true,
            scrollWheelZoom: false
          });
          L.control.zoom({ position: "topright" }).addTo(map2);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18
          }).addTo(map2);
          mapRef.current = map2;
          layerRef.current = L.layerGroup().addTo(map2);
          trafficLayerRef.current = L.layerGroup().addTo(map2);
        }
        const map = mapRef.current;
        const layers = layerRef.current;
        layers.clearLayers();
        if (lineRef.current) {
          lineRef.current.remove();
          lineRef.current = null;
        }
        const makeDivIcon = (letter, color, square = false) => L.divIcon({
          className: "route-marker-icon",
          html: `<span class="route-pin ${square ? "square" : "circle"}" style="--pin:${color}">${letter}</span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        L.marker([data2.origin.lat, data2.origin.lng], {
          icon: makeDivIcon("A", "#255dc4"),
          title: data2.origin.label
        }).bindTooltip(data2.origin.label, { direction: "top", offset: [0, -12] }).addTo(layers);
        if (data2.waypoint) {
          L.marker([data2.waypoint.lat, data2.waypoint.lng], {
            icon: makeDivIcon("S", "#2f8f6b"),
            title: data2.waypoint.label
          }).bindTooltip(data2.waypoint.label, { direction: "top", offset: [0, -12] }).addTo(layers);
        }
        L.marker([data2.destination.lat, data2.destination.lng], {
          icon: makeDivIcon("B", "#202b41", true),
          title: data2.destination.label
        }).bindTooltip(data2.destination.label, { direction: "top", offset: [0, -12] }).addTo(layers);
        const line2 = L.polyline(data2.polyline, {
          color: "#255dc4",
          weight: 5,
          opacity: 0.9,
          lineJoin: "round",
          lineCap: "round"
        }).addTo(map);
        lineRef.current = line2;
        const bounds = line2.getBounds();
        map.fitBounds(bounds.pad(0.18), { animate: false });
        requestAnimationFrame(() => {
          map.invalidateSize();
          map.fitBounds(bounds.pad(0.18), { animate: false });
        });
        const miles = data2.distanceMeters / 1609.344;
        const mins = Math.round(data2.durationSeconds / 60);
        const bits = [];
        if (miles > 0) bits.push(`≈ ${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`);
        if (mins > 0) bits.push(`~${mins} min drive`);
        if (data2.source === "straight") bits.push("straight-line estimate");
        setMeta(bits.join(" · ") || null);
        setStatus("ready");
        setMessage("");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Map temporarily unavailable. Your reservation is unaffected.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [origin, destination, stop, originCoords, destinationCoords, waypointCoords]);
  useEffect(() => {
    if (status !== "ready" || !origin || !destination) return;
    let cancelled = false;
    const params = new URLSearchParams({ origin, destination });
    if (stop) params.set("waypoint", stop);
    if (originCoords) {
      params.set("originLat", String(originCoords.lat));
      params.set("originLng", String(originCoords.lng));
    }
    if (destinationCoords) {
      params.set("destinationLat", String(destinationCoords.lat));
      params.set("destinationLng", String(destinationCoords.lng));
    }
    if (stop && waypointCoords) {
      params.set("waypointLat", String(waypointCoords.lat));
      params.set("waypointLng", String(waypointCoords.lng));
    }
    setTraffic({ state: "loading", segments: [] });
    (async () => {
      try {
        const res = await fetch(`/api/traffic?${params.toString()}`);
        if (!res.ok) {
          if (!cancelled) setTraffic({ state: "unavailable", segments: [] });
          return;
        }
        const data2 = await res.json();
        if (cancelled) return;
        if (!data2.available || !data2.segments || data2.segments.length === 0) {
          setTraffic({ state: "unavailable", segments: [] });
          return;
        }
        setTraffic({ state: "available", segments: data2.segments });
      } catch {
        if (!cancelled) setTraffic({ state: "unavailable", segments: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, origin, destination, stop, originCoords, destinationCoords, waypointCoords]);
  useEffect(() => {
    const layer = trafficLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (traffic.state !== "available" || traffic.segments.length === 0) return;
    const L = leafletRef.current;
    if (!L) return;
    for (const seg of traffic.segments) {
      if (seg.coords.length < 2) continue;
      L.polyline(seg.coords, {
        color: TRAFFIC_COLORS[seg.level],
        weight: 5,
        opacity: 0.95,
        lineJoin: "round",
        lineCap: "round"
      }).addTo(layer);
    }
  }, [traffic]);
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
        lineRef.current = null;
      }
    };
  }, []);
  if (!origin || !destination) return null;
  const label = stop ? "Map of your route from pickup to dropoff via your extra stop" : "Map of your route from pickup to dropoff";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `route-map route-map-live route-map-${variant}`,
      role: "img",
      "aria-label": label,
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            ref: containerRef,
            id: `route-map-${mapId}`,
            className: "route-map-canvas",
            "aria-hidden": status !== "ready"
          }
        ),
        status === "loading" ? /* @__PURE__ */ jsxs("div", { className: "route-map-overlay", children: [
          /* @__PURE__ */ jsx("span", { className: "route-map-spinner", "aria-hidden": true }),
          /* @__PURE__ */ jsx("span", { children: message })
        ] }) : null,
        status === "error" ? /* @__PURE__ */ jsx("div", { className: "route-map-overlay route-map-overlay-error", children: /* @__PURE__ */ jsx("span", { children: message }) }) : null,
        status === "ready" && meta2 ? /* @__PURE__ */ jsx("div", { className: "route-map-meta", children: meta2 }) : null,
        status === "ready" ? /* @__PURE__ */ jsx(TrafficLegend, { traffic }) : null
      ]
    }
  );
}
function TrafficLegend({
  traffic
}) {
  if (traffic.state === "loading") {
    return /* @__PURE__ */ jsxs("div", { className: "route-map-traffic route-map-traffic-loading", role: "status", children: [
      /* @__PURE__ */ jsx("span", { className: "route-map-spinner route-map-spinner-sm", "aria-hidden": true }),
      /* @__PURE__ */ jsx("span", { children: "Checking live traffic…" })
    ] });
  }
  if (traffic.state === "unavailable") {
    return /* @__PURE__ */ jsxs("div", { className: "route-map-traffic route-map-traffic-off", role: "status", children: [
      /* @__PURE__ */ jsx("span", { className: "traffic-dot traffic-dot-off", "aria-hidden": true }),
      /* @__PURE__ */ jsx("span", { children: "Live traffic unavailable" })
    ] });
  }
  const hasHeavy = traffic.segments.some((s) => s.level === "heavy");
  const hasSlow = traffic.segments.some((s) => s.level === "slow");
  const headline = hasHeavy ? "Heavy traffic on route" : hasSlow ? "Some slowdowns on route" : "Free-flowing";
  return /* @__PURE__ */ jsxs("div", { className: "route-map-traffic", role: "status", "aria-label": `Live traffic: ${headline}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "route-map-traffic-head", children: [
      /* @__PURE__ */ jsx("span", { className: `traffic-dot traffic-dot-${hasHeavy ? "heavy" : hasSlow ? "slow" : "free"}`, "aria-hidden": true }),
      /* @__PURE__ */ jsx("span", { className: "route-map-traffic-title", children: headline })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "route-map-traffic-key", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("span", { className: "traffic-dot traffic-dot-free", "aria-hidden": true }),
        "Free flow"
      ] }),
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("span", { className: "traffic-dot traffic-dot-slow", "aria-hidden": true }),
        "Slow"
      ] }),
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("span", { className: "traffic-dot traffic-dot-heavy", "aria-hidden": true }),
        "Heavy"
      ] })
    ] })
  ] });
}
function WheelPicker({ items, value, onChange, ariaLabel, itemHeight = 44 }) {
  const listRef = useRef(null);
  const emitted = useRef(null);
  const settle = useRef(void 0);
  useEffect(() => () => clearTimeout(settle.current), []);
  const selectedIndex = Math.max(0, items.findIndex((item) => item.value === value));
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const index = Math.max(0, items.findIndex((item) => item.value === value));
    if (emitted.current !== value) list.scrollTop = index * itemHeight;
  }, [value, items, itemHeight]);
  function nearestEnabledIndex(index) {
    if (!items[index]?.disabled) return index;
    for (let step = 1; step < items.length; step++) {
      if (items[index - step] && !items[index - step].disabled) return index - step;
      if (items[index + step] && !items[index + step].disabled) return index + step;
    }
    return index;
  }
  function settleSelection() {
    const list = listRef.current;
    if (!list) return;
    const raw = Math.round(list.scrollTop / itemHeight);
    const index = Math.min(items.length - 1, Math.max(0, nearestEnabledIndex(raw)));
    if (list.scrollTop !== index * itemHeight) list.scrollTop = index * itemHeight;
    const item = items[index];
    if (item && item.value !== value) {
      emitted.current = item.value;
      onChange(item.value);
    }
  }
  function handleScroll() {
    clearTimeout(settle.current);
    settle.current = setTimeout(settleSelection, 90);
  }
  function jumpTo(index) {
    const list = listRef.current;
    if (!list) return;
    const target = nearestEnabledIndex(index);
    list.scrollTop = target * itemHeight;
    const item = items[target];
    if (item && item.value !== value) {
      emitted.current = item.value;
      onChange(item.value);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "wheel-picker", role: "group", "aria-label": ariaLabel, children: [
    /* @__PURE__ */ jsx("div", { className: "wheel-highlight", "aria-hidden": "true" }),
    /* @__PURE__ */ jsx("div", { className: "wheel-scroll", ref: listRef, onScroll: handleScroll, children: items.map((item, index) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        disabled: item.disabled,
        className: `wheel-item ${index === selectedIndex ? "active" : ""}`,
        style: { height: itemHeight },
        "aria-current": index === selectedIndex,
        onClick: () => jumpTo(index),
        children: item.label
      },
      item.value
    )) })
  ] });
}
const OPEN_MINUTES = 6 * 60;
const CLOSE_MINUTES = 23 * 60 + 30;
const MINUTE_STEPS = ["00", "30"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}
function buildDate(month, day, picker, pickupDate, todayString) {
  const today = /* @__PURE__ */ new Date();
  const todayYear = today.getFullYear();
  let year = todayYear;
  const candidateThisYear = `${year}-${month}-${day}`;
  const minDate = picker === "return" && pickupDate > todayString ? pickupDate : todayString;
  if (candidateThisYear < minDate) {
    year = todayYear + 1;
  }
  return `${year}-${month}-${day}`;
}
function TripStep({ draft, update, onNext, error, setError, mapsConfigured, fareVisible, currency, carSeatPrice, extraStopPrice, insidePickupPrice, minAdvanceHours }) {
  const [picker, setPicker] = useState(null);
  const [tempMonth, setTempMonth] = useState("");
  const [tempDay, setTempDay] = useState("");
  const [tempTime, setTempTime] = useState("");
  const [pickerError, setPickerError] = useState("");
  const today = /* @__PURE__ */ new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const tempDate = tempMonth && tempDay ? buildDate(tempMonth, tempDay, picker ?? "pickup", draft.date, todayString) : "";
  function openPicker(which) {
    const existing = which === "pickup" ? draft.date : draft.returnDate;
    const fallback = which === "return" && draft.date ? draft.date : todayString;
    const base = existing || fallback;
    setTempMonth(base.slice(5, 7));
    setTempDay(base.slice(8, 10));
    setTempTime((which === "pickup" ? draft.time : draft.returnTime) || "09:00");
    setPickerError("");
    setPicker(which);
  }
  const hour24 = tempTime ? Number(tempTime.slice(0, 2)) : 9;
  const minute = tempTime ? tempTime.slice(3, 5) : "00";
  const hour12 = hour24 % 12 || 12;
  const meridiem = hour24 < 12 ? "AM" : "PM";
  function applyWheel(patch) {
    const nextHour12 = patch.hour ?? String(hour12);
    const nextMinute = patch.minute ?? minute;
    const nextMeridiem = patch.meridiem ?? meridiem;
    let h = Number(nextHour12) % 12;
    if (nextMeridiem === "PM") h += 12;
    let mins = h * 60 + Number(nextMinute);
    mins = Math.min(CLOSE_MINUTES, Math.max(OPEN_MINUTES, mins));
    setTempTime(`${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`);
    setPickerError("");
  }
  const hourItems = Array.from({ length: 12 }, (_, index) => {
    const h12 = index + 1;
    const h24ForMeridiem = meridiem === "AM" ? h12 === 12 ? 0 : h12 : h12 === 12 ? 12 : h12 + 12;
    const mins = h24ForMeridiem * 60 + Number(minute);
    return { value: String(h12), label: String(h12), disabled: mins < OPEN_MINUTES || mins > CLOSE_MINUTES };
  });
  const minuteItems = MINUTE_STEPS.map((m) => ({ value: m, label: m }));
  const meridiemItems = [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" }
  ];
  function saveTime() {
    if (!tempDate || !tempTime) {
      setPickerError("Choose both a date and a time.");
      return;
    }
    const chosen = dateTime(tempDate, tempTime);
    const minHours = Math.min(24, Math.max(1, Math.round(minAdvanceHours || 2)));
    if (Number.isNaN(chosen.getTime()) || picker === "pickup" && chosen.getTime() < Date.now() + minHours * 60 * 60 * 1e3) {
      setPickerError(`Please choose a pickup at least ${minHours} hour${minHours === 1 ? "" : "s"} from now.`);
      return;
    }
    if (picker === "return" && (!draft.date || !draft.time || chosen <= dateTime(draft.date, draft.time))) {
      setPickerError("Your return must be after your pickup.");
      return;
    }
    if (picker === "pickup") update({ date: tempDate, time: tempTime, returnDate: "", returnTime: "" });
    else update({ returnDate: tempDate, returnTime: tempTime });
    setPicker(null);
    setError("");
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "step-scroll", children: [
      /* @__PURE__ */ jsxs("div", { className: "service-tabs", role: "group", "aria-label": "Service type", children: [
        /* @__PURE__ */ jsxs("button", { type: "button", className: `service-tab ${draft.service === "ride" ? "selected" : ""}`, onClick: () => update({ service: "ride" }), children: [
          /* @__PURE__ */ jsx(CarFront, { size: 18 }),
          " Ride"
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: `service-tab ${draft.service === "hourly" ? "selected" : ""}`, onClick: () => update({ service: "hourly", returnTrip: false, extraStopToggle: false }), children: [
          /* @__PURE__ */ jsx(Clock3, { size: 18 }),
          " Hourly"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "booking-row", children: [
        /* @__PURE__ */ jsx(UserRound, { size: 19, className: "row-icon" }),
        /* @__PURE__ */ jsx("span", { children: "For me" }),
        /* @__PURE__ */ jsx(Check, { size: 17, className: "row-end" })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "booking-row row-button", onClick: () => openPicker("pickup"), children: [
        /* @__PURE__ */ jsx(CalendarDays, { size: 19, className: "row-icon" }),
        /* @__PURE__ */ jsx("span", { className: !draft.date ? "placeholder" : "", children: formatTripDate(draft.date, draft.time) }),
        /* @__PURE__ */ jsx(ChevronRight, { size: 18, className: "row-end" })
      ] }),
      draft.service === "hourly" && /* @__PURE__ */ jsxs("div", { className: "booking-row", children: [
        /* @__PURE__ */ jsx(Clock3, { size: 19, className: "row-icon" }),
        /* @__PURE__ */ jsxs("span", { children: [
          draft.hours,
          " hours"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "stepper", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => update({ hours: Math.max(2, draft.hours - 1) }), "aria-label": "Fewer hours", disabled: draft.hours <= 2, children: "−" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => update({ hours: Math.min(12, draft.hours + 1) }), "aria-label": "More hours", disabled: draft.hours >= 12, children: "+" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(LocationField, { value: draft.pickup, onChange: (v) => {
        update({ pickup: v });
        setError("");
      }, onCoords: (c) => update({ pickupCoords: c ?? void 0 }), placeholder: "Add pickup location...", ariaLabel: "Pickup location", marker: "pickup", mapsConfigured }),
      draft.service === "ride" && /* @__PURE__ */ jsx(LocationField, { value: draft.dropoff, onChange: (v) => {
        update({ dropoff: v });
        setError("");
      }, onCoords: (c) => update({ dropoffCoords: c ?? void 0 }), placeholder: "Add dropoff location...", ariaLabel: "Dropoff location", marker: "dropoff", mapsConfigured }),
      /* @__PURE__ */ jsxs("label", { className: "booking-row trip-note-row", children: [
        /* @__PURE__ */ jsx(StickyNote, { size: 19, className: "row-icon" }),
        /* @__PURE__ */ jsx("textarea", { className: "trip-note-input", rows: 2, placeholder: "Note", value: draft.notes, onChange: (e) => update({ notes: e.target.value }), maxLength: 1e3, "aria-label": "Note" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "add-ons", children: [
        /* @__PURE__ */ jsx("span", { className: "add-ons-label", children: "Optional add-ons" }),
        draft.service === "ride" && /* @__PURE__ */ jsxs("div", { className: "add-on-wrap", children: [
          /* @__PURE__ */ jsxs("label", { className: "booking-row return-row add-on-row", children: [
            /* @__PURE__ */ jsx(MapPin, { size: 19, className: "row-icon" }),
            /* @__PURE__ */ jsx("span", { className: "add-on-copy", children: "Add an extra stop" }),
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: draft.extraStopToggle, onChange: (e) => update({ extraStopToggle: e.target.checked, extraStop: e.target.checked ? draft.extraStop : "" }), className: "switch-input", "aria-label": "Add an extra stop" }),
            /* @__PURE__ */ jsx("span", { className: "switch-track", "aria-hidden": "true" })
          ] }),
          fareVisible && draft.extraStopToggle && /* @__PURE__ */ jsx("div", { className: "add-on-price-beneath", children: extraStopPrice > 0 ? `+${formatFare(extraStopPrice, currency)}` : "No charge" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "add-on-wrap", children: [
          /* @__PURE__ */ jsxs("label", { className: "booking-row return-row add-on-row", children: [
            /* @__PURE__ */ jsx(Baby, { size: 19, className: "row-icon" }),
            /* @__PURE__ */ jsx("span", { className: "add-on-copy", children: "Car seat" }),
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: draft.carSeat, onChange: (e) => update({ carSeat: e.target.checked }), className: "switch-input", "aria-label": "Add a car seat" }),
            /* @__PURE__ */ jsx("span", { className: "switch-track", "aria-hidden": "true" })
          ] }),
          fareVisible && draft.carSeat && /* @__PURE__ */ jsx("div", { className: "add-on-price-beneath", children: carSeatPrice > 0 ? `+${formatFare(carSeatPrice, currency)}` : "No charge" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "add-on-wrap", children: [
          /* @__PURE__ */ jsxs("label", { className: "booking-row return-row add-on-row", children: [
            /* @__PURE__ */ jsx(DoorOpen, { size: 19, className: "row-icon" }),
            /* @__PURE__ */ jsx("span", { className: "add-on-copy", children: "Inside pickup" }),
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: draft.insidePickup, onChange: (e) => update({ insidePickup: e.target.checked }), className: "switch-input", "aria-label": "Add inside pickup" }),
            /* @__PURE__ */ jsx("span", { className: "switch-track", "aria-hidden": "true" })
          ] }),
          fareVisible && draft.insidePickup && /* @__PURE__ */ jsx("div", { className: "add-on-price-beneath", children: insidePickupPrice > 0 ? `+${formatFare(insidePickupPrice, currency)}` : "No charge" })
        ] })
      ] }),
      draft.service === "ride" && draft.extraStopToggle && /* @__PURE__ */ jsx(LocationField, { value: draft.extraStop, onChange: (v) => {
        update({ extraStop: v });
        setError("");
      }, onCoords: (c) => update({ extraStopCoords: c ?? void 0 }), placeholder: "Add an optional stop along the way...", ariaLabel: "Extra stop location", marker: "stop", mapsConfigured }),
      draft.service === "ride" && draft.pickup.trim().length >= 5 && draft.dropoff.trim().length >= 5 && /* @__PURE__ */ jsx(RouteMap, { origin: draft.pickup, destination: draft.dropoff, waypoint: draft.extraStop, variant: "inline", originCoords: draft.pickupCoords, destinationCoords: draft.dropoffCoords, waypointCoords: draft.extraStopCoords }),
      draft.service === "ride" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("label", { className: "booking-row return-row", children: [
          /* @__PURE__ */ jsx(Repeat2, { size: 19, className: "row-icon" }),
          /* @__PURE__ */ jsx("span", { children: "Add return trip" }),
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: draft.returnTrip, onChange: (e) => update({ returnTrip: e.target.checked, returnDate: "", returnTime: "" }), className: "switch-input" }),
          /* @__PURE__ */ jsx("span", { className: "switch-track", "aria-hidden": "true" })
        ] }),
        draft.returnTrip && /* @__PURE__ */ jsxs("button", { type: "button", className: "booking-row row-button", onClick: () => openPicker("return"), children: [
          /* @__PURE__ */ jsx(CalendarDays, { size: 19, className: "row-icon" }),
          /* @__PURE__ */ jsx("span", { className: !draft.returnDate ? "placeholder" : "", children: draft.returnDate ? formatTripDate(draft.returnDate, draft.returnTime) : "Choose return date and time" }),
          /* @__PURE__ */ jsx(ChevronRight, { size: 18, className: "row-end" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "under-form", children: [
        "A better way to get there. ",
        /* @__PURE__ */ jsx("strong", { children: "Booked and paid in one place." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "booking-bottom", children: [
      error && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", children: error }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "primary-button", onClick: onNext, children: [
        "Continue ",
        /* @__PURE__ */ jsx(ChevronRight, { size: 17 })
      ] })
    ] }),
    picker && /* @__PURE__ */ jsx("div", { className: "modal-scrim", onMouseDown: (e) => {
      if (e.target === e.currentTarget) setPicker(null);
    }, children: /* @__PURE__ */ jsxs("div", { className: "date-modal", role: "dialog", "aria-modal": "true", "aria-label": picker === "pickup" ? "Choose pickup date and time" : "Choose return date and time", children: [
      /* @__PURE__ */ jsxs("div", { className: "modal-head", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "eyebrow", children: "SCHEDULE YOUR RIDE" }),
          /* @__PURE__ */ jsx("h2", { children: picker === "pickup" ? "When do you need this?" : "When is your return?" })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "icon-button", onClick: () => setPicker(null), "aria-label": "Close", children: /* @__PURE__ */ jsx(X, { size: 19 }) })
      ] }),
      /* @__PURE__ */ jsx("label", { className: "input-label", htmlFor: "trip-month", children: "Choose a date" }),
      /* @__PURE__ */ jsxs("div", { className: "monthday-picker", children: [
        /* @__PURE__ */ jsxs("select", { id: "trip-month", className: "standard-input monthday-select", value: tempMonth, onChange: (e) => {
          setTempMonth(e.target.value);
          setTempDay("");
          setPickerError("");
        }, children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Month" }),
          months.map((m, i) => /* @__PURE__ */ jsx("option", { value: String(i + 1).padStart(2, "0"), children: m }, m))
        ] }),
        /* @__PURE__ */ jsxs("select", { id: "trip-day", className: "standard-input monthday-select", value: tempDay, disabled: !tempMonth, onChange: (e) => {
          setTempDay(e.target.value);
          setPickerError("");
        }, children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Day" }),
          tempMonth && Array.from({ length: daysInMonth(Number(tempMonth), picker === "return" && draft.date ? Number(draft.date.slice(0, 4)) : today.getFullYear()) }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => /* @__PURE__ */ jsx("option", { value: d, children: Number(d) }, d))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "input-label time-label", children: [
        "Choose a pickup time ",
        /* @__PURE__ */ jsxs("span", { "aria-live": "polite", children: [
          hour12,
          ":",
          minute,
          " ",
          meridiem
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "time-wheels", children: [
        /* @__PURE__ */ jsx(WheelPicker, { ariaLabel: "Hour", items: hourItems, value: String(hour12), onChange: (h) => applyWheel({ hour: h }) }),
        /* @__PURE__ */ jsx(WheelPicker, { ariaLabel: "Minutes", items: minuteItems, value: minute, onChange: (m) => applyWheel({ minute: m }) }),
        /* @__PURE__ */ jsx(WheelPicker, { ariaLabel: "AM or PM", items: meridiemItems, value: meridiem, onChange: (mer) => applyWheel({ meridiem: mer }) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "wheel-hint", children: "Spin each wheel to set your time — like tuning a radio dial." }),
      pickerError && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", children: pickerError }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "primary-button modal-save", onClick: saveTime, children: [
        "Confirm time ",
        /* @__PURE__ */ jsx(Check, { size: 17 })
      ] })
    ] }) })
  ] });
}
function baseFare(fare) {
  if (!fare || typeof fare.subtotal !== "number" || !Number.isFinite(fare.subtotal)) return null;
  return fare.subtotal;
}
function VehicleStep({ draft, update, onBack, onNext, error, tiers, fareVisible, tierFares, quoting, currency }) {
  const activeTiers = [...tiers].filter((t) => t.active).sort((a, b) => a.sort - b.sort);
  const selected = activeTiers.find((t) => t.key === draft.vehicle) ?? activeTiers[0];
  const capacity = selected?.capacity ?? 3;
  const fareFor = (key) => tierFares?.find((f) => f.key === key);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "step-scroll", children: [
      /* @__PURE__ */ jsxs("div", { className: "step-heading", children: [
        /* @__PURE__ */ jsx("span", { className: "eyebrow", children: "THE RIGHT RIDE FOR YOU" }),
        /* @__PURE__ */ jsx("h2", { children: "Choose your vehicle." }),
        /* @__PURE__ */ jsx("p", { children: "Pick the space that fits your plans. We’ll confirm your trip details before pickup." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "vehicle-list", children: activeTiers.map((vehicle) => /* @__PURE__ */ jsxs("button", { type: "button", className: `vehicle-option ${draft.vehicle === vehicle.key ? "chosen" : ""}`, onClick: () => update({ vehicle: vehicle.key, passengers: Math.min(draft.passengers, vehicle.capacity) }), children: [
        /* @__PURE__ */ jsx("span", { className: "vehicle-art", children: vehicle.photo ? /* @__PURE__ */ jsx("img", { src: vehicle.photo, alt: vehicle.name, loading: "lazy" }) : /* @__PURE__ */ jsx(CarFront, { size: 27, strokeWidth: 1.5 }) }),
        /* @__PURE__ */ jsxs("span", { className: "vehicle-copy", children: [
          /* @__PURE__ */ jsx("strong", { children: vehicle.name }),
          /* @__PURE__ */ jsx("small", { children: vehicle.detail }),
          /* @__PURE__ */ jsxs("em", { children: [
            /* @__PURE__ */ jsx(UsersRound, { size: 13 }),
            " Up to ",
            vehicle.capacity,
            " passengers"
          ] })
        ] }),
        fareVisible && (() => {
          const f = fareFor(vehicle.key);
          const base = baseFare(f);
          if (f && base !== null) return /* @__PURE__ */ jsx("span", { className: "vehicle-price", children: /* @__PURE__ */ jsx("strong", { children: formatFare(base, currency) }) });
          if (quoting) return /* @__PURE__ */ jsx("span", { className: "vehicle-price vehicle-price-loading", children: /* @__PURE__ */ jsx(Loader2, { size: 15 }) });
          return null;
        })(),
        /* @__PURE__ */ jsx("span", { className: "vehicle-check", children: draft.vehicle === vehicle.key && /* @__PURE__ */ jsx(Check, { size: 15, strokeWidth: 3 }) })
      ] }, vehicle.key)) }),
      /* @__PURE__ */ jsxs("div", { className: "passenger-control", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Passengers" }),
          /* @__PURE__ */ jsx("span", { children: "How many people are traveling?" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "passenger-stepper", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => update({ passengers: Math.max(1, draft.passengers - 1) }), disabled: draft.passengers <= 1, "aria-label": "Fewer passengers", children: "−" }),
          /* @__PURE__ */ jsx("strong", { children: draft.passengers }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => update({ passengers: Math.min(capacity, draft.passengers + 1) }), disabled: draft.passengers >= capacity, "aria-label": "More passengers", children: "+" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "quiet-note", children: fareVisible ? "Prices shown are the base fare only. Tax and gratuity are added on the payment screen." : "Choose the space that fits your plans. We’ll confirm your trip details before pickup." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "booking-bottom", children: [
      /* @__PURE__ */ jsxs("div", { className: "bottom-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "back-button", onClick: onBack, "aria-label": "Go back", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 19 }) }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: "primary-button", onClick: onNext, children: [
          "Continue ",
          /* @__PURE__ */ jsx(ArrowRight, { size: 17 })
        ] })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", children: error })
    ] })
  ] });
}
function DetailsStep({ draft, update, onBack, onNext, error, setError }) {
  function change(patch) {
    update(patch);
    setError("");
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "step-scroll", children: [
      /* @__PURE__ */ jsxs("div", { className: "step-heading", children: [
        /* @__PURE__ */ jsx("span", { className: "eyebrow", children: "ALMOST THERE" }),
        /* @__PURE__ */ jsx("h2", { children: "Who’s traveling?" }),
        /* @__PURE__ */ jsx("p", { children: "We’ll use these details to keep you updated about your request." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "details-fields", children: [
        /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
          "Full name ",
          /* @__PURE__ */ jsx("span", { className: "required", children: "*" }),
          /* @__PURE__ */ jsx("input", { className: "standard-input", type: "text", autoComplete: "name", placeholder: "Your full name", value: draft.name, onChange: (e) => change({ name: e.target.value }), maxLength: 150 })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
          "Email address ",
          /* @__PURE__ */ jsx("span", { className: "required", children: "*" }),
          /* @__PURE__ */ jsx("input", { className: "standard-input", type: "email", autoComplete: "email", placeholder: "you@example.com", value: draft.email, onChange: (e) => change({ email: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
          "Phone number ",
          /* @__PURE__ */ jsx("span", { className: "required", children: "*" }),
          /* @__PURE__ */ jsx("input", { className: "standard-input", type: "tel", autoComplete: "tel", placeholder: "(555) 000-0000", value: draft.phone, onChange: (e) => change({ phone: e.target.value }), maxLength: 40 })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
          "Flight number ",
          /* @__PURE__ */ jsx("span", { className: "optional", children: "Optional" }),
          /* @__PURE__ */ jsx("input", { className: "standard-input", type: "text", placeholder: "For airport pickups", value: draft.flight, onChange: (e) => change({ flight: e.target.value }), maxLength: 60 })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "privacy-note", children: [
        /* @__PURE__ */ jsx(LockKeyhole, { size: 16 }),
        /* @__PURE__ */ jsx("span", { children: "Your details are only used to arrange your ride. No account required." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "booking-bottom", children: [
      error && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", children: error }),
      /* @__PURE__ */ jsxs("div", { className: "bottom-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "back-button", onClick: onBack, "aria-label": "Go back", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 19 }) }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: "primary-button", onClick: onNext, children: [
          "Review request ",
          /* @__PURE__ */ jsx(ArrowRight, { size: 17 })
        ] })
      ] })
    ] })
  ] });
}
function ReviewStep({ draft, onBack, onSubmit, error, submitting, vehicleName, quote, quoting, fareVisible, currency, tip, setTip, tipEnabled, taxEnabled, tollsEnabled, paymentRequired }) {
  const totalReady = Boolean(quote?.ok && quote.fareText);
  const showPrices = fareVisible && Boolean(quote?.ok);
  const tipPresets = [15, 18, 20, 25];
  const canConfirm = paymentRequired ? totalReady && !quoting : true;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "step-scroll", children: [
      /* @__PURE__ */ jsxs("div", { className: "step-heading", children: [
        /* @__PURE__ */ jsx("span", { className: "eyebrow", children: "ONE LAST LOOK" }),
        /* @__PURE__ */ jsx("h2", { children: "Review & pay." }),
        /* @__PURE__ */ jsx("p", { children: fareVisible ? "Check your trip, choose your tip, and see your exact total before you pay to complete your booking." : "Check your trip, then pay to complete your booking." })
      ] }),
      draft.service === "ride" && draft.pickup && draft.dropoff && /* @__PURE__ */ jsx(RouteMap, { origin: draft.pickup, destination: draft.dropoff, waypoint: draft.extraStop, variant: "inline", originCoords: draft.pickupCoords, destinationCoords: draft.dropoffCoords, waypointCoords: draft.extraStopCoords }),
      /* @__PURE__ */ jsxs("div", { className: "review-panel", children: [
        /* @__PURE__ */ jsxs("div", { className: "review-panel-head", children: [
          /* @__PURE__ */ jsx("span", { children: "YOUR TRIP" }),
          /* @__PURE__ */ jsx("span", { className: "status-pill", children: "Pay to book" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "review-route", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "pickup-marker" }),
            /* @__PURE__ */ jsx("strong", { children: draft.pickup })
          ] }),
          draft.service === "ride" && draft.extraStop && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "stop-marker" }),
            /* @__PURE__ */ jsx("strong", { children: draft.extraStop })
          ] }),
          draft.service === "ride" && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "dropoff-marker" }),
            /* @__PURE__ */ jsx("strong", { children: draft.dropoff })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "review-data", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(CalendarDays, { size: 18 }),
            /* @__PURE__ */ jsx("span", { children: "Pickup" }),
            /* @__PURE__ */ jsx("strong", { children: formatTripDate(draft.date, draft.time) })
          ] }),
          draft.service === "hourly" && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Clock3, { size: 18 }),
            /* @__PURE__ */ jsx("span", { children: "Duration" }),
            /* @__PURE__ */ jsxs("strong", { children: [
              draft.hours,
              " hours"
            ] })
          ] }),
          draft.returnTrip && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(CalendarDays, { size: 18 }),
            /* @__PURE__ */ jsx("span", { children: "Return" }),
            /* @__PURE__ */ jsx("strong", { children: formatTripDate(draft.returnDate, draft.returnTime) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(CarFront, { size: 18 }),
            /* @__PURE__ */ jsx("span", { children: "Vehicle" }),
            /* @__PURE__ */ jsx("strong", { children: quote?.tierName ?? vehicleName ?? draft.vehicle })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(UserRound, { size: 18 }),
            /* @__PURE__ */ jsx("span", { children: "Passengers" }),
            /* @__PURE__ */ jsx("strong", { children: draft.passengers })
          ] })
        ] }),
        (draft.carSeat || draft.insidePickup) && /* @__PURE__ */ jsxs("div", { className: "review-add-ons", children: [
          /* @__PURE__ */ jsx("span", { children: "ADD-ONS" }),
          /* @__PURE__ */ jsxs("div", { className: "review-add-on-list", children: [
            draft.carSeat && /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx(Baby, { size: 14 }),
              " Car seat ",
              fareVisible && quote?.carSeatAmount ? `+${formatFare(quote.carSeatAmount, currency)}` : ""
            ] }),
            draft.insidePickup && /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx(DoorOpen, { size: 14 }),
              " Inside pickup ",
              fareVisible && quote?.insidePickupAmount ? `+${formatFare(quote.insidePickupAmount, currency)}` : ""
            ] })
          ] })
        ] })
      ] }),
      showPrices && quote && /* @__PURE__ */ jsxs("div", { className: "fare-breakdown", children: [
        /* @__PURE__ */ jsx("div", { className: "fare-breakdown-head", children: /* @__PURE__ */ jsx("span", { children: "PRICE BREAKDOWN" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
          /* @__PURE__ */ jsx("strong", { children: formatFare(quote.subtotal ?? 0, currency) })
        ] }),
        draft.carSeat && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Car seat" }),
          /* @__PURE__ */ jsx("strong", { children: quote.carSeatAmount ? formatFare(quote.carSeatAmount, currency) : "No charge" })
        ] }),
        draft.service === "ride" && draft.extraStop && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Extra stop" }),
          /* @__PURE__ */ jsx("strong", { children: quote.extraStopAmount ? formatFare(quote.extraStopAmount, currency) : "No charge" })
        ] }),
        draft.insidePickup && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Inside pickup" }),
          /* @__PURE__ */ jsx("strong", { children: quote.insidePickupAmount ? formatFare(quote.insidePickupAmount, currency) : "No charge" })
        ] }),
        tollsEnabled ? quote.tollsAvailable ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Tolls" }),
          /* @__PURE__ */ jsx("strong", { children: formatFare(quote.tollAmount ?? 0, currency) })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "tolls-unavailable", children: [
          /* @__PURE__ */ jsx("span", { children: "Tolls" }),
          /* @__PURE__ */ jsx("em", { children: "Unavailable" })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "fare-line-muted", children: [
          /* @__PURE__ */ jsx("span", { children: "Tolls" }),
          /* @__PURE__ */ jsx("em", { children: "Not included" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "tip-row", children: [
          /* @__PURE__ */ jsxs("span", { className: "tip-row-label", children: [
            /* @__PURE__ */ jsx(Percent, { size: 13 }),
            " Add a tip"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "tip-selector", children: [
            tipPresets.map((p) => /* @__PURE__ */ jsxs("button", { type: "button", className: `tip-option ${tip.kind === "percent" && tip.percent === p ? "chosen" : ""}`, onClick: () => setTip({ kind: "percent", percent: p, amount: 0 }), children: [
              p,
              "%"
            ] }, p)),
            /* @__PURE__ */ jsxs("div", { className: `tip-custom ${tip.kind === "amount" ? "active" : ""}`, children: [
              /* @__PURE__ */ jsx("span", { className: "tip-custom-symbol", children: "$" }),
              /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "1", inputMode: "decimal", placeholder: "Custom", value: tip.kind === "amount" && tip.amount > 0 ? tip.amount : "", onChange: (e) => setTip({ kind: "amount", percent: 0, amount: Number(e.target.value) || 0 }), "aria-label": "Custom tip amount" })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "button", className: `tip-option ${tip.kind === "none" ? "chosen" : ""}`, onClick: () => setTip(NO_TIP), children: "No tip" })
          ] })
        ] }),
        tip.kind !== "none" && quote.tipAmount ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("span", { children: [
            "Tip ",
            tip.kind === "percent" ? `(${tip.percent}%)` : ""
          ] }),
          /* @__PURE__ */ jsx("strong", { children: formatFare(quote.tipAmount, currency) })
        ] }) : null,
        taxEnabled ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Tax" }),
          /* @__PURE__ */ jsx("strong", { children: formatFare(quote.taxAmount ?? 0, currency) })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "fare-line-muted", children: [
          /* @__PURE__ */ jsx("span", { children: "Tax" }),
          /* @__PURE__ */ jsx("em", { children: "Not configured" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "fare-breakdown-total", children: [
          /* @__PURE__ */ jsx("span", { children: "Total" }),
          /* @__PURE__ */ jsx("strong", { children: quote.fareText })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "review-contact", children: [
        /* @__PURE__ */ jsx("span", { children: "CONTACT DETAILS" }),
        /* @__PURE__ */ jsx("strong", { children: draft.name }),
        /* @__PURE__ */ jsxs("p", { children: [
          draft.email,
          /* @__PURE__ */ jsx("br", {}),
          draft.phone
        ] })
      ] }),
      (draft.flight || draft.notes) && /* @__PURE__ */ jsxs("div", { className: "review-contact", children: [
        /* @__PURE__ */ jsx("span", { children: "ADDITIONAL NOTES" }),
        draft.flight && /* @__PURE__ */ jsxs("p", { children: [
          "Flight: ",
          draft.flight
        ] }),
        draft.notes && /* @__PURE__ */ jsx("p", { children: draft.notes })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "review-disclaimer", children: [
        /* @__PURE__ */ jsx(CreditCard, { size: 17 }),
        /* @__PURE__ */ jsx("p", { children: paymentRequired ? "Payment is collected through secure checkout to complete your booking — if payment is canceled, nothing is charged and your request is not booked." : "Your reservation is confirmed directly — no online payment is needed. We will reach out with any pickup details." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "booking-bottom", children: [
      error && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", children: error }),
      /* @__PURE__ */ jsxs("div", { className: "bottom-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "back-button", onClick: onBack, disabled: submitting, "aria-label": "Go back", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 19 }) }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: "primary-button", onClick: onSubmit, disabled: submitting || !canConfirm, children: [
          submitting ? "Confirming booking…" : paymentRequired && !totalReady ? "Retry fare calculation" : "Confirm booking",
          " ",
          !submitting && /* @__PURE__ */ jsx(ArrowRight, { size: 17 })
        ] })
      ] })
    ] })
  ] });
}
function line(label, value, currency) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("span", { children: label }),
    /* @__PURE__ */ jsx("strong", { children: formatFare(value, currency) })
  ] });
}
function PaymentBreakdown({ quote, amount, currency }) {
  if (!quote?.ok) return null;
  const tip = quote.tipAmount ?? 0;
  const tax = quote.taxAmount ?? 0;
  const parts = [
    quote.subtotal ?? 0,
    quote.carSeatAmount ?? 0,
    quote.extraStopAmount ?? 0,
    quote.insidePickupAmount ?? 0,
    quote.tollAmount ?? 0,
    tip,
    tax
  ];
  const summed = Math.round(parts.reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0) * 100) / 100;
  const totalMatches = Math.abs(summed - amount) < 0.02;
  return /* @__PURE__ */ jsxs("div", { className: "fare-breakdown pay-breakdown", children: [
    /* @__PURE__ */ jsx("div", { className: "fare-breakdown-head", children: /* @__PURE__ */ jsx("span", { children: "Price breakdown" }) }),
    line("Base fare", quote.subtotal, currency),
    line("Car seat", quote.carSeatAmount, currency),
    line("Extra stop", quote.extraStopAmount, currency),
    line("Inside pickup", quote.insidePickupAmount, currency),
    line("Tolls", quote.tollAmount, currency),
    line("Gratuity", tip, currency),
    line("Tax", tax, currency),
    /* @__PURE__ */ jsxs("div", { className: "fare-breakdown-total", children: [
      /* @__PURE__ */ jsx("span", { children: "Total" }),
      /* @__PURE__ */ jsx("strong", { children: formatFare(totalMatches ? summed : amount, currency) })
    ] })
  ] });
}
function PaymentStep({
  reservationId,
  amount,
  currency,
  businessName,
  quote,
  squareAppId,
  squareLocationId,
  squareEnvironment,
  onPaid,
  onCancel
}) {
  const cardHostRef = useRef(null);
  const cardRef = useRef(null);
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState("");
  const [sdkError, setSdkError] = useState(false);
  const sdkUrl = squareEnvironment === "sandbox" ? "https://sandbox.web.squarecdn.com/v1/square.js" : "https://web.squarecdn.com/v1/square.js";
  useEffect(() => {
    if (!squareAppId || !squareLocationId) {
      setSdkError(true);
      setPhase("error");
      return;
    }
    let cancelled = false;
    const mountCard = async () => {
      const payments = window.Square.payments(squareAppId, squareLocationId);
      const card = await payments.card();
      if (cancelled) {
        try {
          await card.destroy();
        } catch {
        }
        return;
      }
      cardRef.current = card;
      if (cardHostRef.current) await card.attach(cardHostRef.current);
      if (!cancelled) setPhase("ready");
    };
    const existing = document.querySelector(`script[data-square-sdk="${sdkUrl}"]`);
    if (window.Square) {
      mountCard().catch(() => {
        if (!cancelled) {
          setSdkError(true);
          setPhase("error");
        }
      });
    } else if (existing) {
      existing.addEventListener("load", () => mountCard().catch(() => {
        if (!cancelled) {
          setSdkError(true);
          setPhase("error");
        }
      }));
      existing.addEventListener("error", () => {
        if (!cancelled) {
          setSdkError(true);
          setPhase("error");
        }
      });
    } else {
      const script = document.createElement("script");
      script.src = sdkUrl;
      script.dataset.squareSdk = sdkUrl;
      script.async = true;
      script.onload = () => mountCard().catch(() => {
        if (!cancelled) {
          setSdkError(true);
          setPhase("error");
        }
      });
      script.onerror = () => {
        if (!cancelled) {
          setSdkError(true);
          setPhase("error");
        }
      };
      document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
      const card = cardRef.current;
      cardRef.current = null;
      if (card) {
        try {
          void card.destroy();
        } catch {
        }
      }
    };
  }, [squareAppId, squareLocationId, sdkUrl]);
  async function pay() {
    if (phase === "paying") return;
    const card = cardRef.current;
    if (!card) return;
    setPhase("paying");
    setError("");
    try {
      const result = await card.tokenize();
      if (result.status !== "OK" || !result.token) {
        const msg = result.errors?.[0]?.message || "Please check your card details and try again.";
        setError(msg);
        setPhase("ready");
        return;
      }
      const res = await fetch("/api/square-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          amount,
          currency,
          sourceId: result.token
        })
      });
      const data2 = await res.json().catch(() => ({}));
      if (res.ok && data2?.ok) {
        onPaid();
        return;
      }
      if (data2?.needsConfiguration) {
        setError("Online payment is not fully configured yet. Please contact us to complete your reservation.");
      } else {
        setError(data2?.message || "Your card could not be authorized. Please try a different card.");
      }
      setPhase("ready");
    } catch {
      setError("We couldn't reach the payment service. Please try again.");
      setPhase("ready");
    }
  }
  const amountText = formatFare(amount, currency);
  return /* @__PURE__ */ jsxs("div", { className: "step-scroll", children: [
    /* @__PURE__ */ jsxs("div", { className: "step-heading", children: [
      /* @__PURE__ */ jsx("span", { className: "eyebrow", children: "PAYMENT" }),
      /* @__PURE__ */ jsx("h2", { children: "Authorize your card to confirm your ride." }),
      /* @__PURE__ */ jsxs("p", { children: [
        "Enter your card securely to authorize the fare with ",
        businessName,
        ". Your card is authorized (a hold is placed) for the exact amount shown — it is charged only after your ride is completed."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "pay-amount", children: [
      /* @__PURE__ */ jsxs("span", { className: "pay-amount-label", children: [
        /* @__PURE__ */ jsx(CreditCard, { size: 15 }),
        " Authorization amount"
      ] }),
      /* @__PURE__ */ jsx("strong", { children: amountText })
    ] }),
    /* @__PURE__ */ jsx(PaymentBreakdown, { quote, amount, currency }),
    sdkError ? /* @__PURE__ */ jsxs("div", { className: "pay-setup-needed", children: [
      /* @__PURE__ */ jsx(TriangleAlert, { size: 18 }),
      /* @__PURE__ */ jsx("span", { children: "Secure card payment isn't available right now. Please go back and try again, or contact us to complete your reservation." })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "pay-card-frame", children: [
      /* @__PURE__ */ jsx("div", { ref: cardHostRef, id: "square-card-host", className: "pay-card-host" }),
      phase === "loading" && /* @__PURE__ */ jsxs("div", { className: "pay-card-loading", children: [
        /* @__PURE__ */ jsx("span", { className: "route-map-spinner" }),
        /* @__PURE__ */ jsx("span", { children: "Loading secure card form…" })
      ] })
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", children: error }),
    /* @__PURE__ */ jsxs("div", { className: "pay-security", children: [
      /* @__PURE__ */ jsx(Lock, { size: 14 }),
      /* @__PURE__ */ jsx("span", { children: "Card details are entered directly into Square's secure payment form. We never see or store your card number." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "review-disclaimer", children: [
      /* @__PURE__ */ jsx(ShieldCheck, { size: 17 }),
      /* @__PURE__ */ jsx("p", { children: "Your card is authorized (held) for the fare to confirm your reservation — it is not charged until your ride is completed. If authorization is declined or canceled, nothing is held and your ride is not booked." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "booking-bottom", children: /* @__PURE__ */ jsxs("div", { className: "bottom-actions", children: [
      /* @__PURE__ */ jsx("button", { type: "button", className: "back-button", onClick: onCancel, disabled: phase === "paying", "aria-label": "Go back", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 19 }) }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "primary-button", onClick: pay, disabled: phase !== "ready", children: [
        phase === "paying" ? "Authorizing card…" : phase === "loading" ? "Loading…" : `Authorize ${amountText}`,
        phase !== "paying" && phase !== "loading" && /* @__PURE__ */ jsx(CreditCard, { size: 16 })
      ] })
    ] }) })
  ] });
}
const STORAGE_KEY = "theme";
function readMode() {
  if (typeof document === "undefined") return "auto";
  const m = document.documentElement.getAttribute("data-theme-mode");
  return m === "light" || m === "dark" ? m : "auto";
}
function applyMode(next) {
  if (typeof document === "undefined") return;
  const root2 = document.documentElement;
  root2.setAttribute("data-theme-mode", next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
  }
  const dark = next === "auto" ? window.matchMedia("(prefers-color-scheme: dark)").matches : next === "dark";
  root2.classList.toggle("dark", dark);
}
const LABELS = {
  auto: "Auto appearance — follows device. Click for light mode.",
  light: "Light mode. Click for dark mode.",
  dark: "Dark mode. Click for auto (follow device)."
};
function ThemeToggle({
  className = "theme-toggle",
  label = "Toggle day or night mode"
}) {
  const btnRef = useRef(null);
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const sync = () => {
      const m = readMode();
      btn.setAttribute("aria-label", LABELS[m]);
      btn.setAttribute("title", LABELS[m]);
    };
    sync();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onDevice = () => sync();
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) sync();
    };
    mq.addEventListener("change", onDevice);
    window.addEventListener("storage", onStorage);
    return () => {
      mq.removeEventListener("change", onDevice);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  function toggle() {
    const cur = readMode();
    const next = cur === "auto" ? "light" : cur === "light" ? "dark" : "auto";
    applyMode(next);
    const btn = btnRef.current;
    if (btn) {
      btn.setAttribute("aria-label", LABELS[next]);
      btn.setAttribute("title", LABELS[next]);
    }
  }
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      className,
      "aria-label": label,
      title: label,
      onClick: toggle,
      ref: btnRef,
      children: [
        /* @__PURE__ */ jsx(SunMoon, { className: "theme-icon theme-icon-auto", strokeWidth: 2.2 }),
        /* @__PURE__ */ jsx(Sun, { className: "theme-icon theme-icon-sun", strokeWidth: 2.2 }),
        /* @__PURE__ */ jsx(Moon, { className: "theme-icon theme-icon-moon", strokeWidth: 2.2 })
      ]
    }
  );
}
const QUEUE_LIMIT = 200;
const FLUSH_INTERVAL_MS = 5e3;
let queue = [];
let currentBiz = "";
let flushTimer;
let flushing = false;
function sessionId() {
  try {
    const key = "ab-session";
    let s = sessionStorage.getItem(key);
    if (!s) {
      s = `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(key, s);
    }
    return s;
  } catch {
    return `s-${Date.now().toString(36)}`;
  }
}
function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = void 0;
    void flushActivity();
  }, FLUSH_INTERVAL_MS);
}
function setActivityBiz(biz) {
  currentBiz = biz || "";
  if (currentBiz) scheduleFlush();
}
function trackEvent(input) {
  if (!input.label) return;
  queue.push({ ...input, ts: Date.now() });
  if (queue.length > QUEUE_LIMIT) queue = queue.slice(-QUEUE_LIMIT);
  scheduleFlush();
}
function browsingContext() {
  const ctx = {};
  try {
    if (document.referrer) ctx.referrer = document.referrer;
    ctx.viewport = `${window.innerWidth}x${window.innerHeight}`;
    ctx.screen = `${window.screen.width}x${window.screen.height}`;
    if (navigator.language) ctx.language = navigator.language;
    if (navigator.platform) ctx.platform = navigator.platform;
    const title = document.title;
    if (title) ctx.title = title;
  } catch {
  }
  return ctx;
}
function trackVisit() {
  if (!currentBiz) return;
  try {
    const key = `ab-visit-${sessionId()}-${window.location.pathname}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
  }
  trackEvent({
    type: "visit",
    label: "Visited booking page",
    target: "visit",
    meta: browsingContext()
  });
}
async function flushActivity() {
  if (flushing) return;
  const biz = currentBiz;
  if (!biz || queue.length === 0) return;
  const batch = queue.slice(0, QUEUE_LIMIT);
  queue = queue.slice(batch.length);
  flushing = true;
  try {
    await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        biz,
        session: sessionId(),
        events: batch.map(({ type, label, target, meta: meta2 }) => ({
          type,
          label,
          target,
          page: window.location.pathname + window.location.search,
          meta: { ...meta2, step: currentStep() }
        }))
      }),
      keepalive: true
    });
  } catch {
    queue = [...batch, ...queue].slice(0, QUEUE_LIMIT);
  } finally {
    flushing = false;
  }
}
function currentStep() {
  try {
    const el = document.querySelector(".header-counter");
    if (el && el.textContent) return el.textContent.trim();
  } catch {
  }
  return "";
}
function clip$1(s, max) {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}
function describeClick(target) {
  if (!(target instanceof Element)) return null;
  const pw = target.closest('input[type="password"], input[autocomplete*="cc-"], input[name*="card"], input[inputmode="numeric"][name*="cvc"]');
  if (pw) return null;
  const item = target.closest(".autocomplete-item");
  if (item) {
    const strong = item.querySelector(".autocomplete-copy strong");
    const small = item.querySelector(".autocomplete-copy small");
    const addr = strong?.textContent ?? item.textContent ?? "";
    return {
      type: "address",
      label: clip$1(`Selected address: ${addr}`, 200),
      target: "autocomplete-item",
      meta: small?.textContent ? { area: clip$1(small.textContent, 80) } : void 0
    };
  }
  const actionEl = target.closest(
    ".service-tab, .vehicle-option, .primary-button, .back-button, .header-back, .row-button, .return-row, .add-on-row, .tip-option, .time-grid button, .wheel-item, .monthday-select, .stepper button, .passenger-stepper button, .fare-toggle, .theme-toggle, .modal-save, .icon-button"
  );
  if (actionEl) {
    let label2 = "";
    if (actionEl.classList.contains("vehicle-option")) {
      const name = actionEl.querySelector(".vehicle-copy strong");
      label2 = name?.textContent ?? actionEl.textContent ?? "";
      label2 = `Vehicle: ${clip$1(label2, 60)}`;
    } else if (actionEl.classList.contains("service-tab")) {
      label2 = `Service: ${clip$1(actionEl.textContent ?? "", 40)}`;
    } else if (actionEl.classList.contains("back-button") || actionEl.classList.contains("header-back")) {
      label2 = "Back";
    } else if (actionEl.classList.contains("return-row")) {
      label2 = clip$1(actionEl.textContent ?? "Toggled option", 60);
    } else if (actionEl.classList.contains("add-on-row")) {
      const copy = actionEl.querySelector(".add-on-copy");
      label2 = clip$1(copy?.textContent ?? "Toggled add-on", 60);
    } else if (actionEl.classList.contains("tip-option")) {
      label2 = `Tip: ${clip$1(actionEl.textContent ?? "", 30)}`;
    } else if (actionEl.classList.contains("wheel-item")) {
      label2 = `Time wheel: ${clip$1(actionEl.textContent ?? "", 20)}`;
    } else if (actionEl.classList.contains("monthday-select")) {
      label2 = "Date/time select";
    } else {
      label2 = clip$1(actionEl.getAttribute("aria-label") ?? actionEl.textContent ?? actionEl.tagName.toLowerCase(), 80);
    }
    return { type: "action", label: label2, target: actionEl.className.split(" ")[0] || actionEl.tagName.toLowerCase() };
  }
  const input = target.closest("input, textarea, select");
  if (input) {
    const name = input.getAttribute("aria-label") || input.getAttribute("placeholder") || input.getAttribute("name") || "field";
    return { type: "click", label: `Edited: ${clip$1(name, 60)}`, target: input.tagName.toLowerCase() };
  }
  const label = target.getAttribute("aria-label") || target.textContent || target.tagName.toLowerCase();
  const text = clip$1(label, 100);
  if (!text) return null;
  return { type: "click", label: text, target: target.tagName.toLowerCase() };
}
function useActivityTracker(bizId) {
  const bizRef = useRef(bizId);
  bizRef.current = bizId;
  useEffect(() => {
    setActivityBiz(bizId);
    if (bizId) trackVisit();
  }, [bizId]);
  useEffect(() => {
    function onClick(e) {
      const root2 = document.querySelector(".booking-page, .booking-frame");
      if (!root2 || !root2.contains(e.target)) return;
      const event = describeClick(e.target);
      if (event) trackEvent(event);
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") void flushActivity();
    }
    document.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", () => void flushActivity());
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void flushActivity();
    }, FLUSH_INTERVAL_MS);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
      void flushActivity();
    };
  }, []);
}
const initialDraft = { service: "ride", pickup: "", dropoff: "", extraStop: "", extraStopToggle: false, date: "", time: "", returnTrip: false, returnDate: "", returnTime: "", hours: 3, vehicle: "sedan", passengers: 1, name: "", email: "", phone: "", flight: "", notes: "", carSeat: false, insidePickup: false };
const stages = ["Trip", "Vehicle", "Details", "Review"];
function BookingExperience({ initialBusinessName, initialBizId }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const biz = initialBizId || searchParams.get("biz") || "";
  const { pricing, loaded: pricingLoaded, error: pricingError } = usePricing(biz);
  const businessName = pricing.businessName || initialBusinessName || "ELITELIMOLINK";
  useActivityTracker(pricing.bizId);
  const [draft, setDraft] = useState(initialDraft);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState("");
  const [payReservationId, setPayReservationId] = useState("");
  const [payAmount, setPayAmount] = useState(0);
  const [payQuote, setPayQuote] = useState(null);
  const [done, setDone] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [tip, setTip] = useState(NO_TIP);
  const appliedDefaultTip = useRef(false);
  const update = (patch) => setDraft((prev) => ({ ...prev, ...patch }));
  function go(next) {
    setError("");
    setStep(next);
  }
  const { service, hours, vehicle, returnTrip, pickupCoords, dropoffCoords, extraStopCoords, extraStopToggle, extraStop, carSeat, insidePickup } = draft;
  const useStop = service === "ride" && extraStopToggle && extraStop.trim().length >= 5;
  useEffect(() => {
    if (!pricingLoaded || appliedDefaultTip.current) return;
    appliedDefaultTip.current = true;
    if (pricing.tipEnabled && pricing.tipPercent > 0) {
      setTip({ kind: "percent", percent: pricing.tipPercent, amount: 0 });
    }
  }, [pricingLoaded, pricing.tipEnabled, pricing.tipPercent]);
  const pricingSignature = [
    pricing.bizId,
    pricing.baseRate,
    pricing.minimumFare,
    pricing.perMileRate,
    pricing.hourlyRate,
    pricing.currency,
    pricing.tipEnabled,
    pricing.tipPercent,
    pricing.taxEnabled,
    pricing.taxPercent,
    pricing.tollsEnabled,
    pricing.carSeatPrice,
    pricing.extraStopPrice,
    pricing.insidePickupPrice,
    pricing.vehicleTiers.map((t) => `${t.key}:${t.perMileRate}:${t.multiplier}:${t.minFare}:${t.active ? 1 : 0}`).join("|")
  ].join("~");
  useEffect(() => {
    if (!pricingLoaded) {
      setQuote(null);
      setQuoting(false);
      return;
    }
    if (service === "ride" && (!pickupCoords || !dropoffCoords)) {
      setQuote(null);
      setQuoting(false);
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    setQuoting(true);
    const debounce = window.setTimeout(() => {
      fetch("/api/fare-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service,
          hours,
          vehicle,
          returnTrip,
          biz: pricing.bizId,
          pickupCoords,
          dropoffCoords,
          extraStopCoords: useStop ? extraStopCoords : void 0,
          carSeat,
          insidePickup,
          extraStop: useStop,
          tipKind: tip.kind,
          tipPercent: tip.percent,
          tipAmount: tip.amount
        }),
        signal: controller.signal
      }).then((res) => {
        if (!res.ok) throw new Error(`fare-quote ${res.status}`);
        return res.json();
      }).then((data2) => {
        if (!cancelled) setQuote(data2);
      }).catch(() => {
        if (!cancelled) setQuote(null);
      }).finally(() => {
        if (!cancelled) setQuoting(false);
      });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(debounce);
      controller.abort();
    };
  }, [service, hours, vehicle, returnTrip, pickupCoords, dropoffCoords, extraStopCoords, extraStopToggle, extraStop, carSeat, insidePickup, pricingLoaded, pricing.bizId, pricingSignature, tip.kind, tip.percent, tip.amount]);
  function validateTrip() {
    if (!draft.date || !draft.time) return "Choose your pickup date and time.";
    const minHours = Math.min(24, Math.max(1, Math.round(pricing.minAdvanceHours || 2)));
    if (dateTime(draft.date, draft.time).getTime() < Date.now() + minHours * 60 * 60 * 1e3) return `Pickup must be at least ${minHours} hour${minHours === 1 ? "" : "s"} from now. Please choose a later time.`;
    if (!draft.pickup.trim() || draft.pickup.trim().length < 5) return "Enter a full pickup address or location.";
    if (draft.service === "ride" && (!draft.dropoff.trim() || draft.dropoff.trim().length < 5)) return "Enter a full dropoff address or location.";
    if (draft.service === "ride" && draft.pickup.trim().toLowerCase() === draft.dropoff.trim().toLowerCase()) return "Pickup and dropoff must be different.";
    if (draft.service === "ride" && !draft.pickupCoords) return "Choose your pickup address from the suggestions so we can calculate your exact fare.";
    if (draft.service === "ride" && !draft.dropoffCoords) return "Choose your dropoff address from the suggestions so we can calculate your exact fare.";
    if (useStop && !extraStopCoords) return "Choose your extra stop from the suggestions so we can calculate your exact fare.";
    if (draft.returnTrip && (!draft.returnDate || !draft.returnTime || dateTime(draft.returnDate, draft.returnTime) <= dateTime(draft.date, draft.time))) return "Choose a return date and time after your pickup.";
    return "";
  }
  function tripNext() {
    const message = validateTrip();
    if (message) {
      setError(message);
      return;
    }
    go(1);
  }
  function detailsNext() {
    if (draft.name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (draft.phone.replace(/\D/g, "").length < 7) {
      setError("Enter a valid phone number.");
      return;
    }
    go(3);
  }
  async function freshQuote() {
    try {
      const res = await fetch("/api/fare-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: draft.service,
          hours: draft.hours,
          vehicle: draft.vehicle,
          returnTrip: draft.returnTrip,
          biz: pricing.bizId,
          pickupCoords: draft.pickupCoords,
          dropoffCoords: draft.dropoffCoords,
          extraStopCoords: useStop ? draft.extraStopCoords : void 0,
          carSeat: draft.carSeat,
          insidePickup: draft.insidePickup,
          extraStop: useStop,
          tipKind: tip.kind,
          tipPercent: tip.percent,
          tipAmount: tip.amount
        })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
  async function submit() {
    if (submitting) return;
    const tripError = validateTrip();
    if (tripError) {
      setError(tripError);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const quoteNow = await freshQuote();
      const hasQuote = Boolean(quoteNow?.ok && typeof quoteNow.fare === "number");
      const fare = hasQuote ? quoteNow.fare : 0;
      if (pricing.paymentRequired && !hasQuote) {
        setError(quoteNow?.message || "We couldn’t calculate your exact fare right now. Please try again in a moment.");
        return;
      }
      if (pricing.paymentRequired && !pricing.squareConfigured) {
        setError("Online payment is required to confirm this booking, but card payments are not yet configured. Please contact us to complete your reservation.");
        return;
      }
      let reservationId = reference;
      if (!reservationId) {
        const record = await pocketbaseClient.collection("reservations").create({
          service: draft.service,
          pickup: draft.pickup.trim(),
          dropoff: draft.service === "ride" ? draft.dropoff.trim() : "",
          extraStop: draft.service === "ride" ? draft.extraStop.trim() : "",
          pickupAt: dateTime(draft.date, draft.time).toISOString(),
          returnAt: draft.returnTrip ? dateTime(draft.returnDate, draft.returnTime).toISOString() : "",
          pickupLocal: formatTripDate(draft.date, draft.time),
          returnLocal: draft.returnTrip ? formatTripDate(draft.returnDate, draft.returnTime) : "",
          hours: draft.service === "hourly" ? draft.hours : 2,
          vehicle: draft.vehicle,
          passengers: draft.passengers,
          name: draft.name.trim(),
          email: draft.email.trim(),
          phone: draft.phone.trim(),
          flight: draft.flight.trim(),
          notes: draft.notes.trim(),
          carSeat: draft.carSeat,
          insidePickup: draft.insidePickup,
          distanceMiles: quoteNow?.miles,
          estimatedFare: hasQuote ? fare : void 0,
          estimatedFareText: hasQuote ? quoteNow?.fareText : "",
          subtotal: hasQuote ? quoteNow?.subtotal : void 0,
          tollAmount: hasQuote ? quoteNow?.tollAmount : void 0,
          tipAmount: hasQuote ? quoteNow?.tipAmount : void 0,
          taxAmount: hasQuote ? quoteNow?.taxAmount : void 0,
          status: pricing.paymentRequired ? "pending" : "confirmed",
          paid: false,
          // Retain the booking source/business name on the reservation so the
          // operator can identify where each consolidated request originated,
          // even if the business is later renamed.
          sourceName: businessName,
          // Route the reservation to the operator whose booking page the
          // customer used, so it lands in that business's dashboard only.
          ...pricing.bizId ? { owner: pricing.bizId } : {}
        });
        reservationId = record.id;
        setReference(reservationId);
      }
      if (!pricing.paymentRequired) {
        setDone(true);
        return;
      }
      setPayAmount(fare);
      setPayQuote(quoteNow);
      setPayReservationId(reservationId);
      return;
    } catch {
      setError(pricing.paymentRequired ? reference ? "We couldn’t start payment for your saved request. Please try again — you won’t be charged twice." : "We couldn’t send your request. Please check your details and try again." : "We couldn’t complete your reservation. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }
  function handlePaid() {
    setDone(true);
  }
  async function handlePayCancel() {
    const id = payReservationId || reference;
    setPayReservationId("");
    setPayAmount(0);
    setPayQuote(null);
    if (id) {
      try {
        await fetch("/api/payment-abandon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: id }) });
      } catch {
      }
    }
    setReference("");
    setStep(3);
  }
  const tiers = pricing.vehicleTiers;
  const selectedTier = tiers.find((t) => t.key === draft.vehicle);
  const hasRoute = draft.service === "ride" && Boolean(draft.pickupCoords && draft.dropoffCoords);
  const brandInitials = businessName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "EL";
  const markFirst = brandInitials[0] || "E";
  const markSecond = brandInitials[1] || brandInitials[0] || "L";
  return /* @__PURE__ */ jsxs("main", { className: "booking-page", children: [
    /* @__PURE__ */ jsx("div", { className: "ambient ambient-one" }),
    /* @__PURE__ */ jsx("div", { className: "ambient ambient-two" }),
    /* @__PURE__ */ jsxs("div", { className: "page-brand", children: [
      /* @__PURE__ */ jsxs("span", { className: "brand-mark", children: [
        markFirst,
        /* @__PURE__ */ jsx("span", { children: markSecond })
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "brand-word", children: [
        businessName,
        /* @__PURE__ */ jsx("span", { className: "brand-sub", children: " / RESERVATIONS" })
      ] })
    ] }),
    done ? /* @__PURE__ */ jsxs("div", { className: "payment-card", children: [
      /* @__PURE__ */ jsx(ThemeToggle, { className: "theme-toggle card-theme" }),
      /* @__PURE__ */ jsx("div", { className: "done-check", children: /* @__PURE__ */ jsx(Check, { size: 29, strokeWidth: 2.5 }) }),
      /* @__PURE__ */ jsx("span", { className: "eyebrow", children: "RESERVATION CONFIRMED" }),
      /* @__PURE__ */ jsx("h2", { children: "Your ride is booked." }),
      /* @__PURE__ */ jsxs("p", { className: "done-lead", children: [
        "Thanks",
        draft.name ? /* @__PURE__ */ jsxs(Fragment, { children: [
          ", ",
          /* @__PURE__ */ jsx("strong", { children: draft.name.split(" ")[0] })
        ] }) : null,
        ". Your reservation is complete and has been sent to ",
        businessName,
        ".",
        pricing.paymentRequired ? " Your card has been authorized (a hold placed) for the fare — it is charged only after your ride is completed." : " We will reach out with any pickup details."
      ] }),
      reference && /* @__PURE__ */ jsxs("div", { className: "done-card", children: [
        /* @__PURE__ */ jsxs("div", { className: "done-card-top", children: [
          /* @__PURE__ */ jsx("span", { children: "RESERVATION REFERENCE" }),
          /* @__PURE__ */ jsxs("strong", { children: [
            "RB-",
            reference.slice(-8).toUpperCase()
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "done-card-line", children: [
          /* @__PURE__ */ jsx(CalendarDays, { size: 17 }),
          /* @__PURE__ */ jsx("span", { children: formatTripDate(draft.date, draft.time) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "done-card-line", children: [
          /* @__PURE__ */ jsx(MapPin, { size: 17 }),
          /* @__PURE__ */ jsxs("span", { children: [
            draft.pickup,
            draft.service === "ride" && draft.dropoff ? ` → ${draft.dropoff}` : ""
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "done-footnote", children: "Save your reference for your records." }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "primary-button", onClick: () => {
        setDraft(initialDraft);
        setStep(0);
        setReference("");
        setPayReservationId("");
        setPayAmount(0);
        setPayQuote(null);
        setTip(NO_TIP);
        setError("");
        setDone(false);
        appliedDefaultTip.current = false;
        navigate(biz ? `/?biz=${encodeURIComponent(biz)}` : "/");
      }, children: "Book another ride" })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "booking-frame", children: [
      /* @__PURE__ */ jsxs("div", { className: "action-pane", children: [
        /* @__PURE__ */ jsxs("div", { className: "action-header", children: [
          payReservationId ? /* @__PURE__ */ jsx("button", { type: "button", onClick: handlePayCancel, className: "header-back", "aria-label": "Go back", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }) }) : step > 0 ? /* @__PURE__ */ jsx("button", { type: "button", onClick: () => go(step - 1), className: "header-back", "aria-label": "Go back", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }) }) : /* @__PURE__ */ jsx("span", { className: "header-spacer" }),
          /* @__PURE__ */ jsx("span", { children: "Book a ride" }),
          /* @__PURE__ */ jsx(ThemeToggle, { className: "theme-toggle header-theme" }),
          /* @__PURE__ */ jsx("span", { className: "header-counter", children: `0${step + 1} / 04` })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "progress-rail", "aria-label": `Step ${step + 1} of 4`, children: stages.map((stage, index) => /* @__PURE__ */ jsx("span", { className: index <= step ? "filled" : "" }, stage)) }),
        pricingError && !payReservationId && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", style: { margin: "0 16px 10px" }, children: "We couldn’t load live rates right now. Please refresh the page to see current pricing." }),
        payReservationId ? /* @__PURE__ */ jsx(PaymentStep, { reservationId: payReservationId, amount: payAmount, currency: pricing.currency, quote: payQuote, businessName, squareAppId: pricing.squareAppId, squareLocationId: pricing.squareLocationId, squareEnvironment: pricing.squareEnvironment, onPaid: handlePaid, onCancel: handlePayCancel }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          step === 0 && /* @__PURE__ */ jsx(TripStep, { draft, update, onNext: tripNext, error, setError, mapsConfigured: pricing.mapsConfigured, fareVisible: pricing.fareVisible, currency: pricing.currency, carSeatPrice: pricing.carSeatPrice, extraStopPrice: pricing.extraStopPrice, insidePickupPrice: pricing.insidePickupPrice, minAdvanceHours: pricing.minAdvanceHours }),
          step === 1 && /* @__PURE__ */ jsx(VehicleStep, { draft, update, onBack: () => go(0), onNext: () => go(2), error, tiers, fareVisible: pricing.fareVisible, tierFares: quote?.tierFares, quoting, currency: pricing.currency }),
          step === 2 && /* @__PURE__ */ jsx(DetailsStep, { draft, update, onBack: () => go(1), onNext: detailsNext, error, setError }),
          step === 3 && /* @__PURE__ */ jsx(ReviewStep, { draft, onBack: () => go(2), onSubmit: submit, error, submitting, vehicleName: selectedTier?.name, quote, quoting, fareVisible: pricing.fareVisible, currency: pricing.currency, tip, setTip, tipEnabled: pricing.tipEnabled, taxEnabled: pricing.taxEnabled, tollsEnabled: pricing.tollsEnabled, paymentRequired: pricing.paymentRequired })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "companion-pane", children: [
        /* @__PURE__ */ jsxs("div", { className: "companion-top", children: [
          /* @__PURE__ */ jsxs("div", { className: "operator-line", children: [
            /* @__PURE__ */ jsx("span", { className: "operator-name", children: businessName }),
            /* @__PURE__ */ jsx("span", { className: "operator-separator" }),
            /* @__PURE__ */ jsxs("span", { className: "operator-status", children: [
              /* @__PURE__ */ jsx("span", {}),
              " Accepting requests"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "companion-copy", children: [
            /* @__PURE__ */ jsx("span", { className: "eyebrow", children: `0${step + 1} — ${stages[step].toUpperCase()}` }),
            /* @__PURE__ */ jsx("h1", { children: ["Where to?", "Ride your way.", "The details matter.", "Ready when you are."][step] }),
            /* @__PURE__ */ jsx("p", { children: ["Start with where and when. The rest takes a minute.", "The right car makes every journey feel easier.", "A few details so we can make this trip yours.", "Check your journey, see your total, and pay to book."][step] })
          ] }),
          hasRoute && /* @__PURE__ */ jsx(RouteMap, { origin: draft.pickup, destination: draft.dropoff, waypoint: draft.extraStop, variant: "aside", originCoords: draft.pickupCoords, destinationCoords: draft.dropoffCoords, waypointCoords: draft.extraStopCoords }),
          !hasRoute && step === 0 ? /* @__PURE__ */ jsxs("div", { className: "intro-card", children: [
            /* @__PURE__ */ jsx("div", { className: "intro-graphic", children: /* @__PURE__ */ jsxs("div", { className: "route-orbit", children: [
              /* @__PURE__ */ jsx("div", { className: "orbit-car", children: /* @__PURE__ */ jsx(CarFront, { size: 28, strokeWidth: 1.7 }) }),
              /* @__PURE__ */ jsx("span", { className: "orbit-dot one" }),
              /* @__PURE__ */ jsx("span", { className: "orbit-dot two" })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "intro-caption", children: "A BETTER WAY TO MOVE" }),
              /* @__PURE__ */ jsx("h3", { children: "Your journey starts here." }),
              /* @__PURE__ */ jsx("p", { children: "Book a point-to-point ride or keep a car and driver for the hours you need." })
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "side-summary", children: [
            /* @__PURE__ */ jsxs("div", { className: "summary-top", children: [
              /* @__PURE__ */ jsx("span", { children: "YOUR JOURNEY" }),
              /* @__PURE__ */ jsx("span", { className: "summary-line" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "summary-item", children: [
              /* @__PURE__ */ jsx("span", { className: "summary-icon", children: /* @__PURE__ */ jsx(CalendarDays, { size: 17 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("small", { children: "Pickup (A)" }),
                /* @__PURE__ */ jsx("strong", { children: draft.pickup })
              ] })
            ] }),
            draft.service === "ride" && draft.extraStop && /* @__PURE__ */ jsxs("div", { className: "summary-item", children: [
              /* @__PURE__ */ jsx("span", { className: "summary-icon", children: /* @__PURE__ */ jsx(MapPin, { size: 18 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("small", { children: "Extra stop (S)" }),
                /* @__PURE__ */ jsx("strong", { children: draft.extraStop })
              ] })
            ] }),
            draft.service === "ride" && /* @__PURE__ */ jsxs("div", { className: "summary-item", children: [
              /* @__PURE__ */ jsx("span", { className: "summary-icon", children: /* @__PURE__ */ jsx(MapPin, { size: 18 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("small", { children: "Dropoff (B)" }),
                /* @__PURE__ */ jsx("strong", { children: draft.dropoff })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "summary-item", children: [
              /* @__PURE__ */ jsx("span", { className: "summary-icon", children: /* @__PURE__ */ jsx(CalendarDays, { size: 17 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("small", { children: "Pickup time" }),
                /* @__PURE__ */ jsx("strong", { children: formatTripDate(draft.date, draft.time) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "summary-item", children: [
              /* @__PURE__ */ jsx("span", { className: "summary-icon", children: /* @__PURE__ */ jsx(CarFront, { size: 18 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("small", { children: "Your ride" }),
                /* @__PURE__ */ jsxs("strong", { children: [
                  selectedTier?.name ?? draft.vehicle,
                  draft.service === "hourly" ? ` · ${draft.hours} hours` : ""
                ] })
              ] })
            ] }),
            draft.returnTrip && /* @__PURE__ */ jsxs("div", { className: "summary-item", children: [
              /* @__PURE__ */ jsx("span", { className: "summary-icon", children: /* @__PURE__ */ jsx(Clock3, { size: 17 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("small", { children: "Return" }),
                /* @__PURE__ */ jsx("strong", { children: formatTripDate(draft.returnDate, draft.returnTime) })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "companion-bottom", children: [
          /* @__PURE__ */ jsxs("div", { className: "safety-line", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { size: 16 }),
            /* @__PURE__ */ jsx("span", { children: "Thoughtfully planned. Seamlessly booked." })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "companion-handle", children: [
            businessName,
            " / your journey"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("footer", { className: "site-footer", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " ",
        businessName,
        " reservations"
      ] }),
      /* @__PURE__ */ jsx("a", { href: "/dashboard", className: "footer-link", children: "Operator dashboard" })
    ] })
  ] });
}
const DEFAULT_BUSINESS_NAME$2 = "ELITELIMOLINK";
async function loader$f({
  request,
  url,
  params
}) {
  const host = (request.headers.get("host") || "").toLowerCase();
  const searchBiz = url.searchParams.get("biz");
  const slug = params?.bizSlug;
  if (!slug && !searchBiz && (host.includes("elitelimolink") || !host.includes("."))) {
    return redirect("/driver");
  }
  if (slug && ["login", "dashboard", "dispatch", "driver", "api", "payment", "robots.txt", "sitemap.xml", "favicon.ico", "assets", "images"].includes(slug.toLowerCase())) {
    throw new Response("Not Found", {
      status: 404
    });
  }
  const bizId = await resolveBusinessId(slug || searchBiz, host);
  let businessName = DEFAULT_BUSINESS_NAME$2;
  try {
    const bp = await loadBusinessPricing(bizId);
    if (bp.businessName) businessName = bp.businessName;
  } catch {
  }
  if (slug) {
    const slugNorm = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const nameNorm = (businessName || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const isIdMatch = bizId.toLowerCase() === slugNorm;
    const isNameMatch = nameNorm === slugNorm || nameNorm.includes(slugNorm) || slugNorm.includes(nameNorm);
    if (!isIdMatch && !isNameMatch) {
      throw new Response("Not Found", {
        status: 404
      });
    }
  }
  return {
    businessName,
    bizId
  };
}
async function clientLoader$5({
  serverLoader
}) {
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    const hasPathSlug = window.location.pathname !== "/" && window.location.pathname !== "";
    const isCustomBiz = window.location.search.includes("biz=") || hasPathSlug || host.includes("laguardia") || host.includes("teterboro") || host.includes("alpine") || !host.includes("elitelimolink") && host.includes(".");
    if (!isCustomBiz) {
      throw redirect("/driver");
    }
  }
  const record = pocketbaseClient.authStore.record;
  if (pocketbaseClient.authStore.isValid && record?.collectionName === "drivers") {
    throw redirect("/driver");
  }
  return serverLoader();
}
clientLoader$5.hydrate = true;
function meta$8({
  matches,
  location,
  loaderData
}) {
  const businessName = loaderData?.businessName || DEFAULT_BUSINESS_NAME$2;
  return seo({
    matches,
    location
  }, {
    title: `${businessName} | Reservations`,
    description: `Request a private ride with ${businessName}. Choose your pickup, date and time, vehicle, and share your details in minutes.`
  });
}
const home = UNSAFE_withComponentProps(function HomePage({
  loaderData
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      const hasPathSlug = window.location.pathname !== "/" && window.location.pathname !== "";
      const isCustomBiz = window.location.search.includes("biz=") || hasPathSlug || host.includes("laguardia") || host.includes("teterboro") || host.includes("alpine") || !host.includes("elitelimolink") && host.includes(".");
      if (!isCustomBiz) {
        window.location.replace("/driver");
      }
    }
  }, []);
  return /* @__PURE__ */ jsx(BookingExperience, {
    initialBusinessName: loaderData?.businessName,
    initialBizId: loaderData?.bizId
  });
});
const route36 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clientLoader: clientLoader$5,
  default: home,
  loader: loader$f,
  meta: meta$8
}, Symbol.toStringTag, { value: "Module" }));
function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setUser(pocketbaseClient.authStore.record);
    setIsLoading(false);
    return pocketbaseClient.authStore.onChange((_token, record) => setUser(record));
  }, []);
  return useMemo(
    () => ({
      user,
      isAuthed: Boolean(user),
      isLoading,
      login: (email, password) => pocketbaseClient.collection("users").authWithPassword(email, password),
      signup: async (email, password, extraFields = {}) => {
        await pocketbaseClient.collection("users").create({
          email,
          password,
          passwordConfirm: password,
          ...extraFields
        });
        return pocketbaseClient.collection("users").authWithPassword(email, password);
      },
      logout: () => pocketbaseClient.authStore.clear()
    }),
    [user, isLoading]
  );
}
function ForgotPassword({
  collection,
  onCancel
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await pocketbaseClient.collection(collection).requestPasswordReset(email.trim().toLowerCase());
    } catch {
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  }
  if (sent) {
    return /* @__PURE__ */ jsxs("div", { className: "forgot-success", children: [
      /* @__PURE__ */ jsx("span", { className: "auth-icon", children: /* @__PURE__ */ jsx(MailCheck, { size: 20 }) }),
      /* @__PURE__ */ jsx("h1", { children: "Check your email" }),
      /* @__PURE__ */ jsxs("p", { children: [
        "If an account exists for ",
        /* @__PURE__ */ jsx("strong", { children: email.trim().toLowerCase() }),
        ", we've sent a link to reset your password. The link expires after a short time. Check your spam folder if you don't see it."
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "primary-button", onClick: onCancel, children: "Back to sign in" })
    ] });
  }
  return /* @__PURE__ */ jsxs("form", { className: "forgot-form", onSubmit: handleSubmit, children: [
    /* @__PURE__ */ jsxs("button", { type: "button", className: "forgot-back", onClick: onCancel, children: [
      /* @__PURE__ */ jsx(ArrowLeft, { size: 16 }),
      " Back to sign in"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "auth-head", children: [
      /* @__PURE__ */ jsx("span", { className: "auth-icon", children: /* @__PURE__ */ jsx(MailCheck, { size: 20 }) }),
      /* @__PURE__ */ jsx("h1", { children: "Reset your password" }),
      /* @__PURE__ */ jsxs("p", { children: [
        "Enter your email and we'll send a link to set a new password. The reset applies only to your ",
        collection === "drivers" ? "driver" : "operator",
        " account."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
      "Email address",
      /* @__PURE__ */ jsx("span", { className: "required", children: "*" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "standard-input",
          type: "email",
          autoComplete: "email",
          value: email,
          onChange: (e) => setEmail(e.target.value),
          required: true
        }
      )
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", children: error }),
    /* @__PURE__ */ jsx("button", { type: "submit", className: "primary-button", disabled: submitting, children: submitting ? "Sending link…" : "Send reset link" })
  ] });
}
function meta$7({
  matches,
  location
}) {
  return seo({
    matches,
    location
  }, {
    title: "Operator Sign In | ELITELIMOLINK",
    description: "Sign in or create your operator dashboard to manage fares, vehicle categories, dispatch notifications, and mapping for your own business.",
    noindex: true
  });
}
const login = UNSAFE_withComponentProps(function LoginPage() {
  const {
    login: login2,
    signup,
    isLoading
  } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin");
  const [forgot, setForgot] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expired] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("expired"));
  function switchMode(next) {
    setMode(next);
    setError("");
  }
  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      if (mode === "signup") {
        if (password.length < 8) {
          setError("Choose a password of at least 8 characters.");
          setSubmitting(false);
          return;
        }
        await signup(email.trim().toLowerCase(), password, {
          name: name.trim()
        });
      } else {
        await login2(email.trim().toLowerCase(), password);
      }
      navigate("/dashboard");
    } catch (err) {
      if (mode === "signin") {
        setError("That email or password didn’t match. Please try again.");
      } else {
        const data2 = err?.response?.data;
        const emailMsg = data2?.email?.message;
        const passwordMsg = data2?.password?.message;
        setError(emailMsg ? `Email: ${emailMsg}` : passwordMsg ? `Password: ${passwordMsg}` : "Couldn’t create your dashboard. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }
  const isSignup = mode === "signup";
  return /* @__PURE__ */ jsxs("main", {
    className: "auth-page",
    children: [/* @__PURE__ */ jsx("div", {
      className: "ambient ambient-one"
    }), /* @__PURE__ */ jsx("div", {
      className: "ambient ambient-two"
    }), /* @__PURE__ */ jsxs("a", {
      href: "/",
      className: "page-brand",
      style: {
        textDecoration: "none"
      },
      children: [/* @__PURE__ */ jsxs("span", {
        className: "brand-mark",
        children: ["B", /* @__PURE__ */ jsx("span", {
          children: "L"
        })]
      }), /* @__PURE__ */ jsxs("span", {
        className: "brand-word",
        children: ["ELITELIMOLINK", /* @__PURE__ */ jsx("span", {
          className: "brand-sub",
          children: " / OPERATOR"
        })]
      })]
    }), forgot ? /* @__PURE__ */ jsxs("div", {
      className: "auth-card",
      children: [/* @__PURE__ */ jsx(ThemeToggle, {
        className: "theme-toggle card-theme"
      }), /* @__PURE__ */ jsx(ForgotPassword, {
        collection: "users",
        onCancel: () => setForgot(false)
      })]
    }) : /* @__PURE__ */ jsxs("form", {
      className: "auth-card",
      onSubmit: handleSubmit,
      children: [/* @__PURE__ */ jsx(ThemeToggle, {
        className: "theme-toggle card-theme"
      }), /* @__PURE__ */ jsxs("div", {
        className: "auth-head",
        children: [/* @__PURE__ */ jsx("span", {
          className: "auth-icon",
          children: isSignup ? /* @__PURE__ */ jsx(UserPlus, {
            size: 20
          }) : /* @__PURE__ */ jsx(LockKeyhole, {
            size: 20
          })
        }), /* @__PURE__ */ jsx("h1", {
          children: isSignup ? "Create your dashboard" : "Operator sign in"
        }), /* @__PURE__ */ jsx("p", {
          children: isSignup ? "Each business gets its own private dashboard — rates, vehicle categories, reservations, and dispatch are never shared between operators." : "Manage your fares, dispatch email, and mapping from one place."
        })]
      }), isSignup && /* @__PURE__ */ jsxs("label", {
        className: "input-label",
        children: ["Business / your name", /* @__PURE__ */ jsx("span", {
          className: "optional",
          children: "optional"
        }), /* @__PURE__ */ jsx("input", {
          className: "standard-input",
          type: "text",
          autoComplete: "organization",
          placeholder: "e.g. Smith Chauffeur Services",
          value: name,
          onChange: (e) => setName(e.target.value)
        })]
      }), /* @__PURE__ */ jsxs("label", {
        className: "input-label",
        children: ["Email address", /* @__PURE__ */ jsx("span", {
          className: "required",
          children: "*"
        }), /* @__PURE__ */ jsx("input", {
          className: "standard-input",
          type: "email",
          autoComplete: "email",
          value: email,
          onChange: (e) => setEmail(e.target.value),
          required: true
        })]
      }), /* @__PURE__ */ jsxs("label", {
        className: "input-label",
        children: ["Password", /* @__PURE__ */ jsx("span", {
          className: "required",
          children: "*"
        }), /* @__PURE__ */ jsx("input", {
          className: "standard-input",
          type: "password",
          autoComplete: isSignup ? "new-password" : "current-password",
          minLength: isSignup ? 8 : void 0,
          value: password,
          onChange: (e) => setPassword(e.target.value),
          required: true
        })]
      }), expired && !error && /* @__PURE__ */ jsx("p", {
        className: "form-error",
        role: "alert",
        style: {
          color: "#9a6a2b",
          background: "#fff7e8",
          border: "1px solid #f3e2c0",
          padding: "10px 12px",
          borderRadius: 9
        },
        children: "Your session expired. Please sign in again."
      }), error && /* @__PURE__ */ jsx("p", {
        className: "form-error",
        role: "alert",
        children: error
      }), /* @__PURE__ */ jsx("button", {
        type: "submit",
        className: "primary-button",
        disabled: submitting || isLoading,
        children: submitting ? isSignup ? "Creating…" : "Signing in…" : /* @__PURE__ */ jsxs(Fragment, {
          children: [isSignup ? "Create dashboard" : "Sign in", " ", /* @__PURE__ */ jsx(ArrowRight, {
            size: 17
          })]
        })
      }), !isSignup && /* @__PURE__ */ jsx("button", {
        type: "button",
        className: "auth-forgot",
        onClick: () => {
          setForgot(true);
          setError("");
        },
        children: "Forgot password?"
      }), /* @__PURE__ */ jsx("button", {
        type: "button",
        className: "auth-switch",
        onClick: () => switchMode(isSignup ? "signin" : "signup"),
        children: isSignup ? "Already have a dashboard? Sign in" : "New business? Create your own dashboard"
      }), /* @__PURE__ */ jsx("p", {
        className: "auth-footnote",
        children: "Every operator sees only their own business data."
      })]
    })]
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: login,
  meta: meta$7
}, Symbol.toStringTag, { value: "Module" }));
function collectionNameOf(record) {
  const r = record;
  return r?.collectionName ?? "";
}
function requireAuth(redirectTo = "/login") {
  const { record } = pocketbaseClient.authStore;
  if (!pocketbaseClient.authStore.isValid || !record) {
    throw redirect(redirectTo);
  }
  if (collectionNameOf(record) && collectionNameOf(record) !== "users") {
    throw redirect("/driver");
  }
  return record;
}
function requireDriverAuth(redirectTo = "/driver/login") {
  const { record } = pocketbaseClient.authStore;
  if (!pocketbaseClient.authStore.isValid || !record) {
    throw redirect(redirectTo);
  }
  if (collectionNameOf(record) !== "drivers") {
    throw redirect("/dashboard");
  }
  return record;
}
function isDriverRecord(record) {
  return !!record && record.collectionName === "drivers";
}
function useDriverAuth() {
  const [driver2, setDriver] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const record = pocketbaseClient.authStore.record;
    setDriver(isDriverRecord(record) ? record : null);
    setIsLoading(false);
    return pocketbaseClient.authStore.onChange((_token, record2) => {
      setDriver(isDriverRecord(record2) ? record2 : null);
    });
  }, []);
  return useMemo(
    () => ({
      driver: driver2,
      isAuthed: Boolean(driver2),
      isLoading,
      login: (email, password) => pocketbaseClient.collection("drivers").authWithPassword(email, password),
      signup: async (email, password, extraFields = {}) => {
        await pocketbaseClient.collection("drivers").create({
          email,
          password,
          passwordConfirm: password,
          // Drivers are managed by operators from the dashboard
          // Drivers panel, which lists each driver's email so the
          // operator can contact them. Only operators (users) and
          // the driver themselves can list drivers (see the
          // `drivers` listRule), so exposing the email is safe.
          emailVisibility: true,
          ...extraFields
        });
        return pocketbaseClient.collection("drivers").authWithPassword(email, password);
      },
      logout: () => pocketbaseClient.authStore.clear(),
      refresh: async () => {
        if (!pocketbaseClient.authStore.record) return;
        const rec = await pocketbaseClient.collection("drivers").getOne(pocketbaseClient.authStore.record.id);
        setDriver(rec);
      }
    }),
    [driver2, isLoading]
  );
}
const STATUS_META = {
  pending: {
    id: "pending",
    label: "Pending",
    dot: "#d99a2b",
    chip: "status-pending",
    description: "New request — awaiting operator review."
  },
  confirmed: {
    id: "confirmed",
    label: "Confirmed",
    dot: "#255dc4",
    chip: "status-confirmed",
    description: "Booking accepted and scheduled with a driver."
  },
  completed: {
    id: "completed",
    label: "Completed",
    dot: "#239476",
    chip: "status-completed",
    description: "Trip finished successfully."
  },
  cancelled: {
    id: "cancelled",
    label: "Cancelled",
    dot: "#b5333b",
    chip: "status-cancelled",
    description: "Booking cancelled by operator or customer."
  },
  no_show: {
    id: "no_show",
    label: "No-show",
    dot: "#8a94a5",
    chip: "status-no-show",
    description: "Driver arrived but the passenger did not."
  }
};
const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "no_show", label: "No-show" }
];
const SERVICE_LABELS = {
  ride: "Point-to-point",
  hourly: "Hourly chauffeur"
};
function StatusBadge({ value, size = "md" }) {
  const status = normalizeStatus(value);
  const meta2 = STATUS_META[status];
  return /* @__PURE__ */ jsxs("span", { className: `status-chip ${meta2.chip}${size === "sm" ? " status-chip-sm" : ""}`, children: [
    /* @__PURE__ */ jsx("span", { className: "status-dot", style: { background: meta2.dot } }),
    meta2.label
  ] });
}
function clock$1(iso) {
  if (!iso) return "TBD";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function dayLabel(iso) {
  if (!iso) return "Date to confirm";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date to confirm";
  const today = /* @__PURE__ */ new Date();
  const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  if (isToday) return "Today, " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function formatDurationMinutes(mins) {
  const rounded = Math.max(1, Math.ceil(mins));
  if (rounded < 60) return `${rounded} min`;
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const remH = h % 24;
    return remH > 0 ? `${d}d ${remH}h` : `${d}d`;
  }
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
function getTripTimeWindow(pickupAt, nowMs) {
  if (!pickupAt) {
    return {
      minutesUntilPickup: null,
      canUpdateOnTheWay: true,
      canUpdateArrived: true,
      onTheWayWaitLabel: "Available now",
      arrivedWaitLabel: "Available now",
      pickupCountdownLabel: "Schedule TBD"
    };
  }
  const pickupMs = new Date(pickupAt).getTime();
  if (Number.isNaN(pickupMs)) {
    return {
      minutesUntilPickup: null,
      canUpdateOnTheWay: true,
      canUpdateArrived: true,
      onTheWayWaitLabel: "Available now",
      arrivedWaitLabel: "Available now",
      pickupCountdownLabel: "Schedule TBD"
    };
  }
  const minutesUntilPickup = (pickupMs - nowMs) / 6e4;
  const canUpdateOnTheWay = minutesUntilPickup <= 60;
  const canUpdateArrived = minutesUntilPickup <= 25;
  const onTheWayWaitMins = Math.max(0, minutesUntilPickup - 60);
  const arrivedWaitMins = Math.max(0, minutesUntilPickup - 25);
  const onTheWayWaitLabel = canUpdateOnTheWay ? "Window Open (≤ 1 hr before pickup)" : `Unlocks in ${formatDurationMinutes(onTheWayWaitMins)} (1 hr before pickup)`;
  const arrivedWaitLabel = canUpdateArrived ? "Window Open (≤ 25 min before pickup)" : `Unlocks in ${formatDurationMinutes(arrivedWaitMins)} (25 min before pickup)`;
  let pickupCountdownLabel = "";
  if (minutesUntilPickup > 0) {
    pickupCountdownLabel = `Pickup in ${formatDurationMinutes(minutesUntilPickup)}`;
  } else if (minutesUntilPickup >= -90) {
    pickupCountdownLabel = "Pickup Window Active";
  } else {
    pickupCountdownLabel = "Past Scheduled Pickup";
  }
  return {
    minutesUntilPickup,
    canUpdateOnTheWay,
    canUpdateArrived,
    onTheWayWaitLabel,
    arrivedWaitLabel,
    pickupCountdownLabel
  };
}
function googleMapsUrl(addr) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
}
function wazeUrl(addr) {
  return `https://waze.com/ul?q=${encodeURIComponent(addr)}&navigate=yes`;
}
function appleMapsUrl(addr) {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(addr)}`;
}
function smsBodyUrl(phone, bodyText) {
  const clean = (phone || "").replace(/[^\d+]/g, "");
  if (!clean) return "#";
  const isIos = typeof navigator !== "undefined" && /iPad|iPhone|iPod/i.test(navigator.userAgent);
  const sep = isIos ? "&" : "?";
  return `sms:${clean}${sep}body=${encodeURIComponent(bodyText)}`;
}
function getTripStage(t) {
  const st = normalizeStatus(t.status);
  if (st === "completed" || t.driverStatus === "dropped_off") return 4;
  if (t.driverStatus === "on_board") return 3;
  if (t.driverStatus === "arrived") return 2;
  if (t.driverStatus === "accepted" || t.driverStatus === "on_the_way") return 1;
  return 0;
}
function DriverBoard({
  driverId,
  driverEmail
}) {
  const { logout, refresh } = useDriverAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 15e3);
    return () => window.clearInterval(timer);
  }, []);
  const [activeTab, setActiveTab] = useState("drive");
  const [search, setSearch] = useState("");
  const [driveMenuOpen, setDriveMenuOpen] = useState(false);
  const [actingTripId, setActingTripId] = useState("");
  const [actionError, setActionError] = useState("");
  const [smsBanner, setSmsBanner] = useState(null);
  const [smsSentLog, setSmsSentLog] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("ell_driver_sms_log");
        if (raw) return JSON.parse(raw);
      } catch {
      }
    }
    return {};
  });
  const [gpsStatus, setGpsStatus] = useState("requesting");
  const [lastCoords, setLastCoords] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached2 = localStorage.getItem("ell_last_driver_coords");
        if (cached2) {
          const parsed = JSON.parse(cached2);
          if (typeof parsed?.lat === "number" && typeof parsed?.lng === "number") {
            return { lat: parsed.lat, lng: parsed.lng, speed: parsed.speed || 0, heading: parsed.heading || 0 };
          }
        }
      } catch {
      }
    }
    return null;
  });
  const [screenAwake, setScreenAwake] = useState(true);
  const [driveViewTripId, setDriveViewTripId] = useState(null);
  const [notesDraft, setNotesDraft] = useState({});
  const [savingNoteId, setSavingNoteId] = useState("");
  const [savedNoteId, setSavedNoteId] = useState("");
  const [profile, setProfile] = useState({ name: "", phone: "", vehicle: "sedan" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [pw, setPw] = useState({ password: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");
  async function loadTrips() {
    setError("");
    try {
      const records = await pocketbaseClient.collection("reservations").getFullList({
        sort: "pickupAt",
        requestKey: null
      });
      setTrips(records);
      const initialNotes = {};
      for (const r of records) {
        if (r.driverNotes) initialNotes[r.id] = r.driverNotes;
      }
      setNotesDraft(initialNotes);
      const active = records.find((t) => {
        const stage = getTripStage(t);
        return stage >= 1 && stage <= 3;
      });
      if (active) {
        setDriveViewTripId(active.id);
      } else {
        const sortedRecs = [...records].sort(compareByPickup);
        const upcoming = sortedRecs.find((t) => getTripStage(t) < 4);
        if (upcoming) setDriveViewTripId(upcoming.id);
        else if (sortedRecs.length > 0) setDriveViewTripId(sortedRecs[0].id);
      }
    } catch {
      setError("Couldn’t load your trips. Please sign in again.");
    }
  }
  async function loadProfile() {
    if (!driverId) return;
    try {
      const rec = await pocketbaseClient.collection("drivers").getOne(driverId);
      setProfile({
        name: rec.name ?? "",
        phone: rec.phone ?? "",
        vehicle: rec.vehicle ?? "sedan"
      });
    } catch {
    }
  }
  useEffect(() => {
    setLoading(true);
    void loadTrips().finally(() => setLoading(false));
    void loadProfile();
  }, [driverId]);
  useEffect(() => {
    void pocketbaseClient.collection("reservations").subscribe("*", (e) => {
      setTrips((prev) => {
        if (e.action === "delete") return prev.filter((r) => r.id !== e.record.id);
        const next = e.record;
        return prev.some((r) => r.id === next.id) ? prev.map((r) => r.id === next.id ? next : r) : [next, ...prev];
      });
    }).catch(() => {
    });
    return () => {
      void pocketbaseClient.collection("reservations").unsubscribe("*").catch(() => {
      });
    };
  }, []);
  async function handleTripAction(tripId, action2) {
    if (actingTripId) return;
    setActionError("");
    const previous = trips.find((t) => t.id === tripId);
    if (previous) {
      const tw = getTripTimeWindow(previous.pickupAt, Date.now());
      if ((action2 === "accept" || action2 === "on_the_way") && !tw.canUpdateOnTheWay) {
        setActionError(
          `“On the Way” status can only be updated starting 1 hour before pickup (${tw.onTheWayWaitLabel}).`
        );
        return;
      }
      if (action2 === "arrive" && !tw.canUpdateArrived) {
        setActionError(
          `“Arrived” status can only be updated within the final 25 minutes before pickup (${tw.arrivedWaitLabel}).`
        );
        return;
      }
    }
    setActingTripId(tripId);
    const customerName = previous?.name || "Customer";
    const customerPhone = previous?.phone || "";
    const sentStamp = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
    const autoSmsInfo = action2 === "accept" || action2 === "on_the_way" ? { statusKey: "on_the_way", message: "Your driver is on the way." } : action2 === "arrive" ? { statusKey: "arrived", message: "Your driver has arrived." } : null;
    setTrips(
      (prev) => prev.map((t) => {
        if (t.id !== tripId) return t;
        if (action2 === "accept" || action2 === "on_the_way") {
          return {
            ...t,
            driverStatus: "on_the_way",
            status: t.status === "pending" ? "confirmed" : t.status
          };
        }
        if (action2 === "arrive") {
          return { ...t, driverStatus: "arrived" };
        }
        if (action2 === "pickup") {
          return { ...t, driverStatus: "on_board" };
        }
        if (action2 === "dropoff") {
          return { ...t, driverStatus: "dropped_off", status: "completed" };
        }
        return t;
      })
    );
    if (autoSmsInfo) {
      setSmsSentLog((prev) => {
        const next = {
          ...prev,
          [tripId]: {
            ...prev[tripId] || {},
            [autoSmsInfo.statusKey]: sentStamp
          }
        };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("ell_driver_sms_log", JSON.stringify(next));
          } catch {
          }
        }
        return next;
      });
      setSmsBanner({
        tripId,
        customerName,
        phone: customerPhone,
        message: autoSmsInfo.message,
        status: autoSmsInfo.statusKey,
        sentAt: sentStamp
      });
    }
    try {
      const res = await fetch("/api/driver-trip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pocketbaseClient.authStore.token}`
        },
        body: JSON.stringify({ tripId, action: action2 })
      });
      if (!res.ok) {
        const data2 = await res.json().catch(() => ({}));
        throw new Error(data2.error || "Failed to update trip status.");
      }
      if (!lastCoords && previous?.pickup) {
        void (async () => {
          try {
            const gRes = await fetch(`/api/geocode?address=${encodeURIComponent(previous.pickup)}`);
            if (gRes.ok) {
              const gData = await gRes.json();
              if (typeof gData.lat === "number" && typeof gData.lng === "number") {
                setLastCoords({ lat: gData.lat, lng: gData.lng, speed: 0, heading: 0 });
                setGpsStatus("active");
                await fetch("/api/driver-location", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${pocketbaseClient.authStore.token}`
                  },
                  body: JSON.stringify({
                    lat: gData.lat,
                    lng: gData.lng,
                    heading: 0,
                    speed: 0,
                    tripId,
                    onDuty: true
                  })
                });
              }
            }
          } catch {
          }
        })();
      }
    } catch (err) {
      if (previous) {
        setTrips((prev) => prev.map((t) => t.id === tripId ? previous : t));
      }
      setActionError(err instanceof Error ? err.message : "Could not update trip. Please try again.");
    } finally {
      setActingTripId("");
    }
  }
  async function handleSaveNote(tripId) {
    if (savingNoteId) return;
    setSavingNoteId(tripId);
    const noteContent = (notesDraft[tripId] || "").trim();
    try {
      const res = await fetch("/api/driver-trip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pocketbaseClient.authStore.token}`
        },
        body: JSON.stringify({ tripId, action: "note", note: noteContent })
      });
      if (!res.ok) {
        const data2 = await res.json().catch(() => ({}));
        throw new Error(data2.error || "Failed to save note.");
      }
      setTrips(
        (prev) => prev.map((t) => t.id === tripId ? { ...t, driverNotes: noteContent } : t)
      );
      setSavedNoteId(tripId);
      window.setTimeout(() => setSavedNoteId(""), 2500);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not save note.");
    } finally {
      setSavingNoteId("");
    }
  }
  async function saveProfile(e) {
    e.preventDefault();
    if (savingProfile || !driverId) return;
    setSavingProfile(true);
    setProfileError("");
    setProfileSaved(false);
    try {
      await pocketbaseClient.collection("drivers").update(driverId, {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        vehicle: profile.vehicle
      });
      await refresh();
      setProfileSaved(true);
    } catch {
      setProfileError("Couldn’t save your profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }
  async function savePassword(e) {
    e.preventDefault();
    if (savingPw || !driverId) return;
    if (pw.password.length < 8) {
      setPwError("Choose a password of at least 8 characters.");
      return;
    }
    if (pw.password !== pw.confirm) {
      setPwError("The passwords don’t match.");
      return;
    }
    setSavingPw(true);
    setPwError("");
    setPwSaved(false);
    try {
      await pocketbaseClient.collection("drivers").update(driverId, {
        password: pw.password,
        passwordConfirm: pw.confirm
      });
      setPw({ password: "", confirm: "" });
      setPwSaved(true);
    } catch {
      setPwError("Couldn’t change your password. Please try again.");
    } finally {
      setSavingPw(false);
    }
  }
  function signOut() {
    logout();
    navigate("/driver/login");
  }
  const sorted = useMemo(() => [...trips].sort(compareByPickup), [trips]);
  const activeRide = useMemo(() => {
    return trips.find((t) => {
      const stage = getTripStage(t);
      return stage >= 1 && stage <= 3;
    });
  }, [trips]);
  useEffect(() => {
    if (trips.length === 0) return;
    const currentExists = trips.some((t) => t.id === driveViewTripId);
    if (!driveViewTripId || !currentExists) {
      if (activeRide) {
        setDriveViewTripId(activeRide.id);
      } else {
        const upcoming = sorted.find((t) => getTripStage(t) < 4);
        if (upcoming) setDriveViewTripId(upcoming.id);
        else if (sorted.length > 0) setDriveViewTripId(sorted[0].id);
      }
    }
  }, [trips, activeRide, sorted, driveViewTripId]);
  async function reportDriverGps(lat, lng, heading, speedMph) {
    try {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "ell_last_driver_coords",
            JSON.stringify({ lat, lng, speed: speedMph, heading, updatedAt: Date.now() })
          );
        } catch {
        }
      }
      await fetch("/api/driver-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pocketbaseClient.authStore.token}`
        },
        body: JSON.stringify({
          lat,
          lng,
          heading,
          speed: speedMph,
          tripId: activeRide?.id || driveViewTripId || void 0,
          onDuty: true
        })
      });
    } catch {
    }
  }
  useEffect(() => {
    let wakeLockSentinel = null;
    let isMounted = true;
    async function enableWakeLock() {
      if (typeof window === "undefined") return;
      try {
        const nav = navigator;
        if (nav.wakeLock?.request) {
          wakeLockSentinel = await nav.wakeLock.request("screen");
          if (isMounted) setScreenAwake(true);
          wakeLockSentinel.addEventListener("release", () => {
            if (isMounted) setScreenAwake(false);
          });
        }
      } catch {
        if (isMounted) setScreenAwake(false);
      }
    }
    void enableWakeLock();
    function onUserGesture() {
      void enableWakeLock();
    }
    window.addEventListener("pointerdown", onUserGesture, { once: true });
    window.addEventListener("touchstart", onUserGesture, { once: true });
    function onWakeOrFocus() {
      if (document.visibilityState === "visible") {
        void enableWakeLock();
        void broadcastCurrentOrPickup();
      }
    }
    document.addEventListener("visibilitychange", onWakeOrFocus);
    window.addEventListener("focus", onWakeOrFocus);
    window.addEventListener("pageshow", onWakeOrFocus);
    return () => {
      isMounted = false;
      window.removeEventListener("pointerdown", onUserGesture);
      window.removeEventListener("touchstart", onUserGesture);
      document.removeEventListener("visibilitychange", onWakeOrFocus);
      window.removeEventListener("focus", onWakeOrFocus);
      window.removeEventListener("pageshow", onWakeOrFocus);
      try {
        if (wakeLockSentinel) void wakeLockSentinel.release();
      } catch {
      }
    };
  }, []);
  useEffect(() => {
    if (typeof window === "undefined" || typeof Worker === "undefined") return;
    let worker = null;
    let workerUrl = "";
    try {
      const code = `
        var timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (!timer) {
              timer = setInterval(function() {
                self.postMessage('ping');
              }, 8000);
            }
          } else if (e.data === 'stop') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `;
      const blob = new Blob([code], { type: "application/javascript" });
      workerUrl = URL.createObjectURL(blob);
      worker = new Worker(workerUrl);
      worker.onmessage = () => {
        void broadcastCurrentOrPickup();
      };
      worker.postMessage("start");
    } catch {
    }
    return () => {
      if (worker) {
        worker.postMessage("stop");
        worker.terminate();
      }
      if (workerUrl) {
        URL.revokeObjectURL(workerUrl);
      }
    };
  }, [activeRide?.id, activeRide?.pickup]);
  async function broadcastCurrentOrPickup() {
    setActionError("");
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsStatus("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const heading = pos.coords.heading || 0;
        const speedMph = pos.coords.speed ? Math.round(pos.coords.speed * 2.23694) : 0;
        setGpsStatus("active");
        setLastCoords({ lat, lng, speed: speedMph, heading });
        void reportDriverGps(lat, lng, heading, speedMph);
      },
      async () => {
        const targetAddr = activeRide?.pickup || sorted[0]?.pickup;
        if (targetAddr) {
          try {
            const res = await fetch(`/api/geocode?address=${encodeURIComponent(targetAddr)}`);
            if (res.ok) {
              const data2 = await res.json();
              if (typeof data2.lat === "number" && typeof data2.lng === "number") {
                setLastCoords({ lat: data2.lat, lng: data2.lng, speed: 0, heading: 0 });
                setGpsStatus("active");
                void reportDriverGps(data2.lat, data2.lng, 0, 0);
                return;
              }
            }
          } catch {
          }
        }
        setLastCoords({ lat: 40.8501, lng: -74.0608, speed: 0, heading: 0 });
        setGpsStatus("standby");
        void reportDriverGps(40.8501, -74.0608, 0, 0);
      },
      { enableHighAccuracy: false, timeout: 8e3 }
    );
  }
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsStatus("unsupported");
      return;
    }
    let isMounted = true;
    let lastReportTime = 0;
    function handlePosition(pos) {
      if (!isMounted) return;
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const heading = pos.coords.heading || 0;
      const speedMph = pos.coords.speed ? Math.round(pos.coords.speed * 2.23694) : 0;
      setGpsStatus("active");
      setLastCoords({ lat, lng, speed: speedMph, heading });
      const now = Date.now();
      if (now - lastReportTime >= 6e3) {
        lastReportTime = now;
        void reportDriverGps(lat, lng, heading, speedMph);
      }
    }
    function handleGpsError(err) {
      if (!isMounted) return;
      if (err.code === err.PERMISSION_DENIED) {
        setGpsStatus("denied");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        handlePosition,
        () => {
          if (!isMounted) return;
          setGpsStatus("standby");
          if (activeRide?.pickup && !lastCoords) {
            void (async () => {
              try {
                const res = await fetch(`/api/geocode?address=${encodeURIComponent(activeRide.pickup)}`);
                if (res.ok) {
                  const data2 = await res.json();
                  if (typeof data2.lat === "number" && typeof data2.lng === "number" && isMounted) {
                    setLastCoords({ lat: data2.lat, lng: data2.lng, speed: 0, heading: 0 });
                    void reportDriverGps(data2.lat, data2.lng, 0, 0);
                  }
                }
              } catch {
              }
            })();
          }
        },
        { enableHighAccuracy: false, timeout: 12e3, maximumAge: 3e4 }
      );
    }
    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handleGpsError,
      {
        enableHighAccuracy: true,
        maximumAge: 1e4,
        timeout: 1e4
      }
    );
    const intervalId = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        handlePosition,
        () => {
          navigator.geolocation.getCurrentPosition(handlePosition, () => {
          }, {
            enableHighAccuracy: false,
            timeout: 1e4
          });
        },
        { enableHighAccuracy: false, timeout: 1e4 }
      );
    }, 12e3);
    return () => {
      isMounted = false;
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(intervalId);
    };
  }, [activeRide?.id, activeRide?.pickup]);
  const stats = useMemo(() => {
    const today = /* @__PURE__ */ new Date();
    let todayCount = 0;
    let activeCount = 0;
    let completedCount = 0;
    for (const t of trips) {
      const stage = getTripStage(t);
      if (stage === 4) {
        completedCount++;
      } else {
        activeCount++;
      }
      if (t.pickupAt) {
        const d = new Date(t.pickupAt);
        if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
          todayCount++;
        }
      }
    }
    return {
      total: trips.length,
      active: activeCount,
      completed: completedCount,
      today: todayCount
    };
  }, [trips]);
  const filteredTrips = useMemo(() => {
    let list = sorted;
    if (activeTab === "active") {
      list = list.filter((t) => getTripStage(t) < 4);
    } else if (activeTab === "completed") {
      list = list.filter((t) => getTripStage(t) === 4);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) => (t.name || "").toLowerCase().includes(q) || (t.pickup || "").toLowerCase().includes(q) || (t.dropoff || "").toLowerCase().includes(q) || (t.flight || "").toLowerCase().includes(q) || (t.sourceName || "").toLowerCase().includes(q) || (t.id || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [sorted, activeTab, search]);
  const gpsLabel = gpsStatus === "active" ? "GPS Live" : gpsStatus === "standby" ? "GPS Standby" : gpsStatus === "denied" ? "GPS Blocked" : "GPS Connecting";
  return /* @__PURE__ */ jsxs("main", { className: "dashboard-page", children: [
    /* @__PURE__ */ jsx("div", { className: "ambient ambient-one" }),
    /* @__PURE__ */ jsx("div", { className: "ambient ambient-two" }),
    /* @__PURE__ */ jsxs("header", { className: "dashboard-header", children: [
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/driver",
          className: "page-brand",
          style: { textDecoration: "none" },
          onClick: (e) => {
            e.preventDefault();
            setActiveTab("drive");
          },
          children: [
            /* @__PURE__ */ jsxs("span", { className: "brand-mark", children: [
              "E",
              /* @__PURE__ */ jsx("span", { children: "L" })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "brand-word", children: [
              "ELITELIMOLINK",
              /* @__PURE__ */ jsx("span", { className: "brand-sub", children: " / CHAUFFEUR" })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "dashboard-user", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "driver-driveview-pill",
            style: {
              padding: "6px 12px",
              fontSize: 12,
              background: activeTab === "drive" ? "#2563eb" : void 0,
              color: activeTab === "drive" ? "#fff" : void 0
            },
            onClick: () => {
              setActiveTab("drive");
              if (activeRide) setDriveViewTripId(activeRide.id);
              else if (sorted.length > 0 && !driveViewTripId) setDriveViewTripId(sorted[0].id);
            },
            title: "Open Driver View HUD",
            children: [
              /* @__PURE__ */ jsx(Compass, { size: 13 }),
              " Driver View"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "span",
          {
            className: "driver-wakelock-pill",
            title: screenAwake ? "Screen Wake Lock is active" : "Tap anywhere to keep screen awake",
            children: [
              /* @__PURE__ */ jsx(SunMedium, { size: 12 }),
              " ",
              screenAwake ? "Screen Awake" : "Wake Ready"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "span",
          {
            className: "driver-duty-badge",
            title: "Real-time GPS telemetry status",
            children: [
              /* @__PURE__ */ jsx(Radio, { size: 12, style: { marginRight: 4 } }),
              gpsLabel
            ]
          }
        ),
        /* @__PURE__ */ jsx("span", { style: { fontWeight: 600 }, children: profile.name || driverEmail }),
        /* @__PURE__ */ jsx(ThemeToggle, { className: "theme-toggle compact" }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: "dashboard-link", onClick: signOut, children: [
          /* @__PURE__ */ jsx(LogOut, { size: 14, style: { display: "inline", marginRight: 4 } }),
          " Sign out"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dashboard-shell", children: [
      /* @__PURE__ */ jsxs("div", { className: "dashboard-intro", children: [
        /* @__PURE__ */ jsx("span", { className: "eyebrow", children: "CHAUFFEUR MISSION PORTAL" }),
        /* @__PURE__ */ jsx("h1", { children: "Driver Mission Center" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Manage active assignments in real time. ",
          /* @__PURE__ */ jsx("strong", { children: "On the Way" }),
          " unlocks 1 hour before pickup (auto-sends ",
          /* @__PURE__ */ jsx("em", { children: "“Your driver is on the way.”" }),
          ") and ",
          /* @__PURE__ */ jsx("strong", { children: "Arrived" }),
          " unlocks 25 minutes before pickup (auto-sends ",
          /* @__PURE__ */ jsx("em", { children: "“Your driver has arrived.”" }),
          ")."
        ] })
      ] }),
      activeRide && /* @__PURE__ */ jsxs("div", { className: "driver-active-banner", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ jsx("span", { className: "fleet-live-pulse" }),
            /* @__PURE__ */ jsxs("strong", { style: { fontSize: 15, color: "#38bdf8" }, children: [
              "Active Ride In Progress: ",
              activeRide.name || "Guest"
            ] }),
            activeRide.sourceName && /* @__PURE__ */ jsx("span", { className: "driver-brand-tag", children: activeRide.sourceName })
          ] }),
          /* @__PURE__ */ jsx("p", { style: { margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }, children: getTripStage(activeRide) <= 2 ? `Heading to Pickup: ${activeRide.pickup}` : `En Route to Dropoff: ${activeRide.dropoff}` })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "driver-driveview-pill",
            style: { fontSize: 13, padding: "10px 18px", background: "#2563eb", color: "#fff", border: 0 },
            onClick: () => {
              setDriveViewTripId(activeRide.id);
              setActiveTab("drive");
            },
            children: [
              /* @__PURE__ */ jsx(Compass, { size: 16 }),
              " Open Drive View HUD"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "driver-stats-grid", children: [
        /* @__PURE__ */ jsxs("div", { className: "driver-stat-card", children: [
          /* @__PURE__ */ jsx("span", { className: "driver-stat-num", children: stats.total }),
          /* @__PURE__ */ jsx("span", { className: "driver-stat-label", children: "Assigned Trips" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "driver-stat-card", style: { borderLeft: "3px solid #2563eb" }, children: [
          /* @__PURE__ */ jsx("span", { className: "driver-stat-num", style: { color: "#2563eb" }, children: stats.today }),
          /* @__PURE__ */ jsx("span", { className: "driver-stat-label", children: "Today’s Schedule" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "driver-stat-card", style: { borderLeft: "3px solid #0284c7" }, children: [
          /* @__PURE__ */ jsx("span", { className: "driver-stat-num", style: { color: "#0284c7" }, children: stats.active }),
          /* @__PURE__ */ jsx("span", { className: "driver-stat-label", children: "Active / Upcoming" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "driver-stat-card", style: { borderLeft: "3px solid #16a34a" }, children: [
          /* @__PURE__ */ jsx("span", { className: "driver-stat-num", style: { color: "#16a34a" }, children: stats.completed }),
          /* @__PURE__ */ jsx("span", { className: "driver-stat-label", children: "Completed Rides" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "driver-filter-bar", children: [
        /* @__PURE__ */ jsxs("div", { className: "driver-tab-group", role: "tablist", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": activeTab === "active",
              className: `driver-tab-btn${activeTab === "active" ? " active" : ""}`,
              onClick: () => setActiveTab("active"),
              children: [
                /* @__PURE__ */ jsx(Sparkles, { size: 14 }),
                " Active & Upcoming",
                /* @__PURE__ */ jsx("span", { className: "badge-pill", children: stats.active })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": activeTab === "drive",
              className: `driver-tab-btn driver-tab-drive${activeTab === "drive" ? " active" : ""}`,
              onClick: () => {
                setActiveTab("drive");
                if (activeRide) {
                  setDriveViewTripId(activeRide.id);
                } else if (sorted.length > 0) {
                  setDriveViewTripId(sorted[0].id);
                }
              },
              children: [
                /* @__PURE__ */ jsx(Compass, { size: 14 }),
                " 🚗 Driver View",
                activeRide && /* @__PURE__ */ jsx("span", { className: "fleet-live-pulse" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": activeTab === "completed",
              className: `driver-tab-btn${activeTab === "completed" ? " active" : ""}`,
              onClick: () => setActiveTab("completed"),
              children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 14 }),
                " Completed",
                /* @__PURE__ */ jsx("span", { className: "badge-pill", children: stats.completed })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": activeTab === "all",
              className: `driver-tab-btn${activeTab === "all" ? " active" : ""}`,
              onClick: () => setActiveTab("all"),
              children: [
                "All Trips",
                /* @__PURE__ */ jsx("span", { className: "badge-pill", children: stats.total })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": activeTab === "settings",
              className: `driver-tab-btn${activeTab === "settings" ? " active" : ""}`,
              onClick: () => setActiveTab("settings"),
              children: [
                /* @__PURE__ */ jsx(Settings, { size: 14 }),
                " Profile & Vehicle"
              ]
            }
          )
        ] }),
        activeTab !== "settings" && /* @__PURE__ */ jsxs("div", { className: "driver-search-wrap", children: [
          /* @__PURE__ */ jsx(Search, { size: 15 }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "search",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              placeholder: "Search passenger, address, flight, brand…",
              "aria-label": "Search trips"
            }
          ),
          search && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setSearch(""),
              style: { position: "absolute", right: 10, top: 10, border: 0, background: "transparent", cursor: "pointer", color: "var(--ink-light)" },
              "aria-label": "Clear search",
              children: /* @__PURE__ */ jsx(X, { size: 14 })
            }
          )
        ] })
      ] }),
      actionError && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", style: { marginBottom: 16 }, children: actionError }),
      smsBanner && /* @__PURE__ */ jsxs(
        "div",
        {
          role: "status",
          style: {
            marginBottom: 16,
            padding: "14px 16px",
            background: smsBanner.status === "arrived" ? "#f0fdf4" : "#eff6ff",
            border: `1.5px solid ${smsBanner.status === "arrived" ? "#22c55e" : "#3b82f6"}`,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)"
          },
          children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  style: {
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: smsBanner.status === "arrived" ? "#16a34a" : "#2563eb",
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  },
                  children: /* @__PURE__ */ jsx(MessageSquare, { size: 17 })
                }
              ),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, fontWeight: 800, color: smsBanner.status === "arrived" ? "#15803d" : "#1d4ed8", textTransform: "uppercase", letterSpacing: ".04em" }, children: [
                  "✓ Automated SMS Sent to ",
                  smsBanner.customerName,
                  smsBanner.phone ? ` (${smsBanner.phone})` : "",
                  " • ",
                  smsBanner.sentAt
                ] }),
                /* @__PURE__ */ jsxs("div", { style: { fontSize: 15, fontWeight: 800, color: "#0f172a", marginTop: 2 }, children: [
                  "“",
                  smsBanner.message,
                  "”"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
              smsBanner.phone && /* @__PURE__ */ jsxs(
                "a",
                {
                  href: smsBodyUrl(smsBanner.phone, smsBanner.message),
                  className: "driver-tool-btn",
                  style: { background: "#0f172a", color: "#fff", border: 0, fontWeight: 700, padding: "6px 12px", fontSize: 12 },
                  children: [
                    /* @__PURE__ */ jsx(MessageSquare, { size: 13 }),
                    " Open in Phone SMS"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setSmsBanner(null),
                  style: { border: 0, background: "transparent", cursor: "pointer", color: "#64748b", padding: 4 },
                  "aria-label": "Dismiss SMS notification",
                  children: /* @__PURE__ */ jsx(X, { size: 16 })
                }
              )
            ] })
          ]
        }
      ),
      activeTab !== "settings" ? /* @__PURE__ */ jsx("div", { children: loading ? /* @__PURE__ */ jsxs("div", { className: "dash-loading", children: [
        /* @__PURE__ */ jsx(Loader2, { size: 20 }),
        " Loading assigned trips…"
      ] }) : error ? /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", children: error }) : filteredTrips.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "reservations-empty", style: { padding: "48px 20px", background: "#fff", borderRadius: 16, border: "1px solid var(--border-ride)" }, children: [
        /* @__PURE__ */ jsx(RefreshCw, { size: 28, style: { opacity: 0.5, marginBottom: 8 } }),
        /* @__PURE__ */ jsx("p", { style: { fontWeight: 600, color: "var(--ink)" }, children: search ? "No trips match your search." : activeTab === "completed" ? "No completed trips yet." : "No active trips at this moment." }),
        /* @__PURE__ */ jsx("small", { style: { color: "var(--ink-mid)" }, children: "New rides assigned by dispatch will appear here automatically." })
      ] }) : /* @__PURE__ */ jsx("div", { children: filteredTrips.map((t) => {
        const stage = getTripStage(t);
        const st = normalizeStatus(t.status);
        const round = Boolean(t.returnAt);
        const isBusy = actingTripId === t.id;
        const isNoteBusy = savingNoteId === t.id;
        const isNoteSaved = savedNoteId === t.id;
        const currentDraft = notesDraft[t.id] ?? t.driverNotes ?? "";
        const tripSms = smsSentLog[t.id] || {};
        const onTheWaySent = stage >= 1 || Boolean(tripSms.on_the_way);
        const arrivedSent = stage >= 2 || Boolean(tripSms.arrived);
        const tw = getTripTimeWindow(t.pickupAt, nowMs);
        return /* @__PURE__ */ jsxs(
          "article",
          {
            className: `driver-mission-item${stage > 0 && stage < 4 ? " is-active" : ""}`,
            children: [
              /* @__PURE__ */ jsxs("div", { className: "driver-mission-top", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("h2", { className: "driver-guest-title", children: [
                    /* @__PURE__ */ jsx(User, { size: 18, color: "var(--blue)" }),
                    t.name || "Unnamed Guest",
                    t.sourceName && /* @__PURE__ */ jsx("span", { className: "driver-brand-tag", children: t.sourceName })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }, children: [
                    /* @__PURE__ */ jsxs("span", { style: { fontSize: 12, color: "var(--ink-light)", fontWeight: 600 }, children: [
                      "REF: RB-",
                      t.id.slice(-8).toUpperCase()
                    ] }),
                    /* @__PURE__ */ jsx(StatusBadge, { value: st }),
                    stage < 4 && /* @__PURE__ */ jsxs(
                      "span",
                      {
                        style: {
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: tw.canUpdateArrived ? "#dcfce7" : tw.canUpdateOnTheWay ? "#dbeafe" : "#f1f5f9",
                          color: tw.canUpdateArrived ? "#166534" : tw.canUpdateOnTheWay ? "#1e40af" : "#475569"
                        },
                        children: [
                          "⏰ ",
                          tw.pickupCountdownLabel
                        ]
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "driver-time-chip", children: [
                  /* @__PURE__ */ jsx(Clock, { size: 16, color: "var(--blue)" }),
                  /* @__PURE__ */ jsx("strong", { children: clock$1(t.pickupAt) }),
                  /* @__PURE__ */ jsx("small", { children: dayLabel(t.pickupAt) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "reservation-card-route", style: { margin: 0 }, children: [
                t.pickup && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }, children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("span", { className: "pickup-marker" }),
                    " ",
                    /* @__PURE__ */ jsx("strong", { children: "Pickup:" }),
                    " ",
                    t.pickup
                  ] }),
                  /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                    /* @__PURE__ */ jsxs(
                      "a",
                      {
                        href: googleMapsUrl(t.pickup),
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "driver-tool-btn",
                        title: "Navigate to Pickup with Google Maps",
                        children: [
                          /* @__PURE__ */ jsx(Navigation, { size: 13, color: "#2563eb" }),
                          " Maps"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "a",
                      {
                        href: wazeUrl(t.pickup),
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "driver-tool-btn",
                        title: "Navigate to Pickup with Waze",
                        children: [
                          /* @__PURE__ */ jsx(Compass, { size: 13, color: "#0284c7" }),
                          " Waze"
                        ]
                      }
                    )
                  ] })
                ] }),
                t.extraStop && /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "stop-marker" }),
                  " ",
                  /* @__PURE__ */ jsx("strong", { children: "Extra stop:" }),
                  " ",
                  t.extraStop
                ] }),
                t.dropoff && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginTop: 4 }, children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("span", { className: "dropoff-marker mini" }),
                    " ",
                    /* @__PURE__ */ jsx("strong", { children: "Dropoff:" }),
                    " ",
                    t.dropoff
                  ] }),
                  /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                    /* @__PURE__ */ jsxs(
                      "a",
                      {
                        href: googleMapsUrl(t.dropoff),
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "driver-tool-btn",
                        title: "Navigate to Dropoff with Google Maps",
                        children: [
                          /* @__PURE__ */ jsx(Navigation, { size: 13, color: "#16a34a" }),
                          " Maps"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "a",
                      {
                        href: wazeUrl(t.dropoff),
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "driver-tool-btn",
                        title: "Navigate to Dropoff with Waze",
                        children: [
                          /* @__PURE__ */ jsx(Compass, { size: 13, color: "#0284c7" }),
                          " Waze"
                        ]
                      }
                    )
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "reservation-card-meta", style: { margin: 0, gap: 10 }, children: [
                t.vehicle && /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx(CarFront, { size: 14 }),
                  " ",
                  vehicles.find((v) => v.id === t.vehicle)?.name ?? t.vehicle
                ] }),
                t.passengers > 0 && /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx(Users, { size: 14 }),
                  " ",
                  t.passengers,
                  " passengers"
                ] }),
                round && /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx(RefreshCw, { size: 14 }),
                  " Round trip"
                ] }),
                t.flight && /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: `https://www.google.com/search?q=${encodeURIComponent(t.flight + " flight status")}`,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "driver-tool-btn",
                    style: { padding: "3px 8px", fontSize: 11 },
                    children: [
                      /* @__PURE__ */ jsx(Plane, { size: 13 }),
                      " Flight ",
                      t.flight
                    ]
                  }
                ),
                t.carSeat && /* @__PURE__ */ jsxs("span", { style: { color: "#b45309" }, children: [
                  /* @__PURE__ */ jsx(Baby, { size: 14 }),
                  " Car seat required"
                ] }),
                t.insidePickup && /* @__PURE__ */ jsxs("span", { style: { color: "#2563eb" }, children: [
                  /* @__PURE__ */ jsx(DoorOpen, { size: 14 }),
                  " Inside pickup / Meet & Greet"
                ] }),
                t.phone && /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: `tel:${t.phone.replace(/[^\d+]/g, "")}`,
                    className: "driver-tool-btn",
                    style: { color: "#1d4ed8", fontWeight: 800 },
                    children: [
                      /* @__PURE__ */ jsx(Phone, { size: 13 }),
                      " Call ",
                      t.phone
                    ]
                  }
                )
              ] }),
              t.notes && /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, background: "#f8fafc", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", color: "var(--ink-mid)" }, children: [
                /* @__PURE__ */ jsx("strong", { style: { color: "var(--ink)", display: "block", marginBottom: 2 }, children: "Passenger Instructions:" }),
                t.notes
              ] }),
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "6px 0" }, children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    className: "driver-driveview-pill",
                    onClick: () => {
                      setDriveViewTripId(t.id);
                      setActiveTab("drive");
                    },
                    title: "Open Cockpit Drive View HUD",
                    children: [
                      /* @__PURE__ */ jsx(Compass, { size: 14 }),
                      " 🚗 Drive View HUD"
                    ]
                  }
                ),
                stage >= 1 && stage <= 3 && /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: "#16a34a", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }, children: [
                  /* @__PURE__ */ jsx("span", { className: "fleet-live-pulse" }),
                  " Live Trip GPS Active"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "driver-pipeline-container", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    disabled: isBusy || !tw.canUpdateOnTheWay,
                    onClick: () => handleTripAction(t.id, "on_the_way"),
                    className: `driver-pipe-step${stage >= 1 ? " done" : stage === 0 ? " current" : ""}`,
                    style: {
                      border: 0,
                      background: "transparent",
                      cursor: !tw.canUpdateOnTheWay ? "not-allowed" : "pointer",
                      padding: 0,
                      opacity: !tw.canUpdateOnTheWay && stage < 1 ? 0.55 : 1
                    },
                    title: tw.canUpdateOnTheWay ? 'Set status to On the Way & send "Your driver is on the way."' : tw.onTheWayWaitLabel,
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "driver-pipe-num", children: stage >= 1 ? "✓" : !tw.canUpdateOnTheWay ? "🔒" : "1" }),
                      /* @__PURE__ */ jsx("span", { children: "On the Way" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: `driver-pipe-divider${stage >= 1 ? " done" : ""}` }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    disabled: isBusy || !tw.canUpdateArrived,
                    onClick: () => handleTripAction(t.id, "arrive"),
                    className: `driver-pipe-step${stage >= 2 ? " done" : stage === 1 ? " current" : ""}`,
                    style: {
                      border: 0,
                      background: "transparent",
                      cursor: !tw.canUpdateArrived ? "not-allowed" : "pointer",
                      padding: 0,
                      opacity: !tw.canUpdateArrived && stage < 2 ? 0.55 : 1
                    },
                    title: tw.canUpdateArrived ? 'Set status to Arrived & send "Your driver has arrived."' : tw.arrivedWaitLabel,
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "driver-pipe-num", children: stage >= 2 ? "✓" : !tw.canUpdateArrived ? "🔒" : "2" }),
                      /* @__PURE__ */ jsx("span", { children: "Arrived" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: `driver-pipe-divider${stage >= 2 ? " done" : ""}` }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    disabled: isBusy,
                    onClick: () => handleTripAction(t.id, "pickup"),
                    className: `driver-pipe-step${stage >= 3 ? " done" : stage === 2 ? " current" : ""}`,
                    style: { border: 0, background: "transparent", cursor: "pointer", padding: 0 },
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "driver-pipe-num", children: stage >= 3 ? "✓" : "3" }),
                      /* @__PURE__ */ jsx("span", { children: "On Board" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: `driver-pipe-divider${stage >= 3 ? " done" : ""}` }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    disabled: isBusy,
                    onClick: () => handleTripAction(t.id, "dropoff"),
                    className: `driver-pipe-step${stage === 4 ? " done" : stage === 3 ? " current" : ""}`,
                    style: { border: 0, background: "transparent", cursor: "pointer", padding: 0 },
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "driver-pipe-num", children: stage === 4 ? "✓" : "4" }),
                      /* @__PURE__ */ jsx("span", { children: "Drop Off" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "driver-actions-bar", children: [
                stage === 0 && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    className: "driver-primary-btn btn-accept",
                    disabled: isBusy || !tw.canUpdateOnTheWay,
                    onClick: () => handleTripAction(t.id, "on_the_way"),
                    style: !tw.canUpdateOnTheWay ? { background: "#64748b", cursor: "not-allowed", opacity: 0.85 } : void 0,
                    children: [
                      isBusy ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }) : !tw.canUpdateOnTheWay ? /* @__PURE__ */ jsx(LockKeyhole, { size: 16 }) : /* @__PURE__ */ jsx(Navigation, { size: 16, strokeWidth: 2.5 }),
                      tw.canUpdateOnTheWay ? "On the Way — Notify Customer (“Your driver is on the way.”)" : `On the Way Locked • ${tw.onTheWayWaitLabel}`
                    ]
                  }
                ),
                stage === 1 && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    className: "driver-primary-btn btn-arrive",
                    disabled: isBusy || !tw.canUpdateArrived,
                    onClick: () => handleTripAction(t.id, "arrive"),
                    style: !tw.canUpdateArrived ? { background: "#64748b", cursor: "not-allowed", opacity: 0.85 } : void 0,
                    children: [
                      isBusy ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }) : !tw.canUpdateArrived ? /* @__PURE__ */ jsx(LockKeyhole, { size: 16 }) : /* @__PURE__ */ jsx(MapPin, { size: 16, strokeWidth: 2.5 }),
                      tw.canUpdateArrived ? "Arrived — Notify Customer (“Your driver has arrived.”)" : `Arrived Locked • ${tw.arrivedWaitLabel}`
                    ]
                  }
                ),
                stage === 2 && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    className: "driver-primary-btn btn-pickup",
                    disabled: isBusy,
                    onClick: () => handleTripAction(t.id, "pickup"),
                    children: [
                      isBusy ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsx(UserCheck, { size: 16, strokeWidth: 2.5 }),
                      "Pick Up Passenger (On Board)"
                    ]
                  }
                ),
                stage === 3 && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    className: "driver-primary-btn btn-dropoff",
                    disabled: isBusy,
                    onClick: () => handleTripAction(t.id, "dropoff"),
                    children: [
                      isBusy ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsx(Flag, { size: 16, strokeWidth: 2.5 }),
                      "Drop Off Passenger (Complete Trip)"
                    ]
                  }
                ),
                stage === 4 && /* @__PURE__ */ jsxs("div", { className: "driver-primary-btn btn-done", children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { size: 18 }),
                  " Ride Completed"
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    padding: "12px 14px",
                    background: "#f8fafc",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8
                  },
                  children: [
                    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }, children: [
                      /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "#334155", display: "inline-flex", alignItems: "center", gap: 6 }, children: [
                        /* @__PURE__ */ jsx(MessageSquare, { size: 13, color: "#2563eb" }),
                        " Automated Customer SMS & Time Windows"
                      ] }),
                      t.phone && /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: "#64748b", fontWeight: 600 }, children: [
                        "Recipient: ",
                        t.phone
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 8 }, children: [
                      /* @__PURE__ */ jsxs(
                        "div",
                        {
                          style: {
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: onTheWaySent ? "#eff6ff" : "#ffffff",
                            border: `1px solid ${onTheWaySent ? "#bfdbfe" : "#e2e8f0"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8
                          },
                          children: [
                            /* @__PURE__ */ jsxs("div", { children: [
                              /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, fontWeight: 700, color: onTheWaySent ? "#1d4ed8" : "#64748b" }, children: [
                                "Status: On the Way ",
                                tripSms.on_the_way ? `(${tripSms.on_the_way})` : ""
                              ] }),
                              /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: "#0f172a" }, children: "“Your driver is on the way.”" }),
                              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: tw.canUpdateOnTheWay ? "#16a34a" : "#d97706", fontWeight: 600, marginTop: 2 }, children: tw.canUpdateOnTheWay ? "✓ 1-Hr Window Open" : `🔒 ${tw.onTheWayWaitLabel}` })
                            ] }),
                            /* @__PURE__ */ jsx(
                              "button",
                              {
                                type: "button",
                                disabled: isBusy || !tw.canUpdateOnTheWay,
                                onClick: () => handleTripAction(t.id, "on_the_way"),
                                style: {
                                  border: 0,
                                  borderRadius: 8,
                                  padding: "6px 10px",
                                  fontSize: 11,
                                  fontWeight: 800,
                                  cursor: !tw.canUpdateOnTheWay ? "not-allowed" : "pointer",
                                  background: !tw.canUpdateOnTheWay ? "#e2e8f0" : onTheWaySent ? "#dbeafe" : "#2563eb",
                                  color: !tw.canUpdateOnTheWay ? "#64748b" : onTheWaySent ? "#1e40af" : "#ffffff",
                                  whiteSpace: "nowrap"
                                },
                                children: !tw.canUpdateOnTheWay ? "🔒 1 Hr Prior" : onTheWaySent ? "✓ Sent · Resend" : "Set On the Way"
                              }
                            )
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        "div",
                        {
                          style: {
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: arrivedSent ? "#f0fdf4" : "#ffffff",
                            border: `1px solid ${arrivedSent ? "#bbf7d0" : "#e2e8f0"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8
                          },
                          children: [
                            /* @__PURE__ */ jsxs("div", { children: [
                              /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, fontWeight: 700, color: arrivedSent ? "#15803d" : "#64748b" }, children: [
                                "Status: Arrived ",
                                tripSms.arrived ? `(${tripSms.arrived})` : ""
                              ] }),
                              /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: "#0f172a" }, children: "“Your driver has arrived.”" }),
                              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: tw.canUpdateArrived ? "#16a34a" : "#d97706", fontWeight: 600, marginTop: 2 }, children: tw.canUpdateArrived ? "✓ 25-Min Window Open" : `🔒 ${tw.arrivedWaitLabel}` })
                            ] }),
                            /* @__PURE__ */ jsx(
                              "button",
                              {
                                type: "button",
                                disabled: isBusy || !tw.canUpdateArrived,
                                onClick: () => handleTripAction(t.id, "arrive"),
                                style: {
                                  border: 0,
                                  borderRadius: 8,
                                  padding: "6px 10px",
                                  fontSize: 11,
                                  fontWeight: 800,
                                  cursor: !tw.canUpdateArrived ? "not-allowed" : "pointer",
                                  background: !tw.canUpdateArrived ? "#e2e8f0" : arrivedSent ? "#dcfce7" : "#16a34a",
                                  color: !tw.canUpdateArrived ? "#64748b" : arrivedSent ? "#166534" : "#ffffff",
                                  whiteSpace: "nowrap"
                                },
                                children: !tw.canUpdateArrived ? "🔒 25 Min Prior" : arrivedSent ? "✓ Sent · Resend" : "Set Arrived"
                              }
                            )
                          ]
                        }
                      )
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "driver-note-box", children: [
                /* @__PURE__ */ jsxs("div", { className: "driver-note-head", children: [
                  /* @__PURE__ */ jsx("span", { children: "Driver Trip Notes & Summary" }),
                  t.driverNotes && /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#16a34a", fontWeight: 700 }, children: "✓ Saved on Record" })
                ] }),
                t.driverNotes && /* @__PURE__ */ jsx("div", { className: "driver-notes-history", children: t.driverNotes }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    className: "driver-note-textarea",
                    rows: 2,
                    value: currentDraft,
                    onChange: (e) => setNotesDraft((prev) => ({ ...prev, [t.id]: e.target.value })),
                    placeholder: stage === 4 ? "Add drop-off notes (e.g. passenger safely dropped off at Terminal 4, toll receipt $15.50, smooth trip)..." : "Add notes about this ride (toll fees, luggage count, special requests, passenger comments)..."
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    className: `driver-note-save-btn${isNoteSaved ? " saved" : ""}`,
                    disabled: isNoteBusy,
                    onClick: () => handleSaveNote(t.id),
                    children: [
                      isNoteBusy ? /* @__PURE__ */ jsx(Loader2, { size: 13, className: "animate-spin" }) : isNoteSaved ? /* @__PURE__ */ jsx(Check, { size: 13, strokeWidth: 3 }) : /* @__PURE__ */ jsx(Save, { size: 13 }),
                      isNoteSaved ? "Saved!" : isNoteBusy ? "Saving…" : "Save Driver Note"
                    ]
                  }
                )
              ] })
            ]
          },
          t.id
        );
      }) }) }) : (
        /* Tab 4: Driver Profile & Vehicle Settings */
        /* @__PURE__ */ jsxs("div", { className: "dashboard-grid", style: { gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }, children: [
          /* @__PURE__ */ jsxs("form", { className: "dash-card", onSubmit: saveProfile, children: [
            /* @__PURE__ */ jsxs("div", { className: "dash-card-head", children: [
              /* @__PURE__ */ jsx("span", { className: "dash-card-icon", children: /* @__PURE__ */ jsx(Users, { size: 18 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h2", { children: "Your Chauffeur Profile" }),
                /* @__PURE__ */ jsx("p", { children: "Visible to central dispatch when assigning trips." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
              "Full name",
              /* @__PURE__ */ jsx(
                "input",
                {
                  className: "standard-input",
                  type: "text",
                  value: profile.name,
                  onChange: (e) => setProfile((p) => ({ ...p, name: e.target.value }))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "input-label", style: { marginTop: 13 }, children: [
              "Phone number",
              /* @__PURE__ */ jsx(
                "input",
                {
                  className: "standard-input",
                  type: "tel",
                  value: profile.phone,
                  onChange: (e) => setProfile((p) => ({ ...p, phone: e.target.value }))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "input-label", style: { marginTop: 13 }, children: [
              "Preferred Vehicle",
              /* @__PURE__ */ jsx(
                "select",
                {
                  className: "standard-input",
                  value: profile.vehicle,
                  onChange: (e) => setProfile((p) => ({ ...p, vehicle: e.target.value })),
                  children: vehicles.map((v) => /* @__PURE__ */ jsxs("option", { value: v.id, children: [
                    v.name,
                    " (",
                    v.capacity,
                    " passengers)"
                  ] }, v.id))
                }
              )
            ] }),
            profileError && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", style: { marginTop: 13 }, children: profileError }),
            /* @__PURE__ */ jsx("div", { className: "dash-actions", style: { marginTop: 18 }, children: /* @__PURE__ */ jsx("button", { type: "submit", className: "primary-button", disabled: savingProfile, children: savingProfile ? "Saving…" : /* @__PURE__ */ jsxs(Fragment, { children: [
              profileSaved ? /* @__PURE__ */ jsx(Check, { size: 17 }) : /* @__PURE__ */ jsx(Save, { size: 17 }),
              profileSaved ? "Profile Saved" : "Save Profile"
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsxs("form", { className: "dash-card", onSubmit: savePassword, children: [
            /* @__PURE__ */ jsxs("div", { className: "dash-card-head", children: [
              /* @__PURE__ */ jsx("span", { className: "dash-card-icon", children: /* @__PURE__ */ jsx(LockKeyhole, { size: 18 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h2", { children: "Security & Password" }),
                /* @__PURE__ */ jsx("p", { children: "Choose and control your private password." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
              "New password",
              /* @__PURE__ */ jsx(
                "input",
                {
                  className: "standard-input",
                  type: "password",
                  autoComplete: "new-password",
                  minLength: 8,
                  value: pw.password,
                  onChange: (e) => setPw((p) => ({ ...p, password: e.target.value }))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "input-label", style: { marginTop: 13 }, children: [
              "Confirm new password",
              /* @__PURE__ */ jsx(
                "input",
                {
                  className: "standard-input",
                  type: "password",
                  autoComplete: "new-password",
                  minLength: 8,
                  value: pw.confirm,
                  onChange: (e) => setPw((p) => ({ ...p, confirm: e.target.value }))
                }
              )
            ] }),
            pwError && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", style: { marginTop: 13 }, children: pwError }),
            /* @__PURE__ */ jsx("div", { className: "dash-actions", style: { marginTop: 18 }, children: /* @__PURE__ */ jsx("button", { type: "submit", className: "primary-button", disabled: savingPw, children: savingPw ? "Updating…" : /* @__PURE__ */ jsxs(Fragment, { children: [
              pwSaved ? /* @__PURE__ */ jsx(Check, { size: 17 }) : /* @__PURE__ */ jsx(Save, { size: 17 }),
              pwSaved ? "Password Updated" : "Update Password"
            ] }) }) })
          ] })
        ] })
      )
    ] }),
    (activeTab === "drive" || driveViewTripId) && (() => {
      const t = driveViewTripId ? trips.find((x) => x.id === driveViewTripId) : activeRide || sorted.find((x) => getTripStage(x) < 4) || sorted[0] || null;
      if (!t) {
        return /* @__PURE__ */ jsxs("div", { className: "driver-driveview-modal", role: "dialog", "aria-modal": "true", "aria-label": "Chauffeur Standby Cockpit", children: [
          driveMenuOpen && /* @__PURE__ */ jsx(
            "div",
            {
              className: "trip-scrim",
              style: { zIndex: 1e5, background: "rgba(0,0,0,0.65)" },
              onClick: () => setDriveMenuOpen(false),
              children: /* @__PURE__ */ jsxs("div", { className: "driver-drivemenu-drawer", onClick: (e) => e.stopPropagation(), children: [
                /* @__PURE__ */ jsxs("div", { className: "driver-drivemenu-head", children: [
                  /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                    /* @__PURE__ */ jsx("span", { className: "fleet-live-pulse" }),
                    /* @__PURE__ */ jsx("strong", { style: { fontSize: 15, color: "#38bdf8" }, children: "Driver View Menu" })
                  ] }),
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setDriveMenuOpen(false), "aria-label": "Close menu", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "driver-drivemenu-body", children: [
                  /* @__PURE__ */ jsxs("div", { className: "driver-drivemenu-section", children: [
                    /* @__PURE__ */ jsx("span", { className: "driver-drivemenu-label", children: "Assigned Missions" }),
                    /* @__PURE__ */ jsx("p", { style: { fontSize: 12, color: "#94a3b8", margin: 0 }, children: "No active rides assigned. Central Dispatch will stream new assignments directly to your HUD." })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "driver-drivemenu-section", children: [
                    /* @__PURE__ */ jsx("span", { className: "driver-drivemenu-label", children: "Quick Contacts" }),
                    /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: /* @__PURE__ */ jsxs("a", { href: "tel:+12015550199", className: "driver-drivemenu-link", children: [
                      /* @__PURE__ */ jsx(Phone, { size: 15, color: "#eab308" }),
                      " Call Central Dispatch (Office)"
                    ] }) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "driver-drivemenu-section", children: [
                    /* @__PURE__ */ jsx("span", { className: "driver-drivemenu-label", children: "Mission Center" }),
                    /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          className: "driver-drivemenu-link",
                          onClick: () => {
                            setDriveMenuOpen(false);
                            setActiveTab("all");
                          },
                          children: [
                            /* @__PURE__ */ jsx(CheckCircle2, { size: 15 }),
                            " All Trips Schedule"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          className: "driver-drivemenu-link",
                          onClick: () => {
                            setDriveMenuOpen(false);
                            setActiveTab("settings");
                          },
                          children: [
                            /* @__PURE__ */ jsx(Settings, { size: 15 }),
                            " Chauffeur Profile & Vehicle"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          className: "driver-drivemenu-link",
                          style: { color: "#ef4444" },
                          onClick: () => {
                            setDriveMenuOpen(false);
                            signOut();
                          },
                          children: [
                            /* @__PURE__ */ jsx(LogOut, { size: 15 }),
                            " Sign Out (Chauffeur Portal)"
                          ]
                        }
                      )
                    ] })
                  ] })
                ] })
              ] })
            }
          ),
          /* @__PURE__ */ jsxs("header", { className: "driver-driveview-topbar", children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }, children: [
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, marginRight: 4 }, children: [
                /* @__PURE__ */ jsxs("span", { className: "brand-mark", style: { width: 24, height: 24, fontSize: 11, borderRadius: 6 }, children: [
                  "E",
                  /* @__PURE__ */ jsx("span", { children: "L" })
                ] }),
                /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 900, color: "#fff", letterSpacing: ".04em" }, children: "ELITELIMOLINK" })
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "driver-tool-btn",
                  style: { background: "#2563eb", color: "#fff", border: 0, fontWeight: 800 },
                  onClick: () => setDriveMenuOpen(true),
                  "aria-label": "Open Driver View Menu",
                  children: [
                    /* @__PURE__ */ jsx(Menu, { size: 16 }),
                    " Driver Menu"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "driver-tool-btn",
                  style: { background: "#1e293b", color: "#cbd5e1", border: "1px solid #334155" },
                  onClick: () => setActiveTab("all"),
                  title: "View All Scheduled Trips",
                  children: [
                    /* @__PURE__ */ jsx(Calendar, { size: 14 }),
                    " All Trips"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("span", { className: "driver-wakelock-pill", title: "Screen Wake Lock is active", children: [
                /* @__PURE__ */ jsx(SunMedium, { size: 12 }),
                " ",
                screenAwake ? "Screen Awake" : "Wake Ready"
              ] }),
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                /* @__PURE__ */ jsx("span", { className: "fleet-live-pulse" }),
                /* @__PURE__ */ jsx("strong", { style: { fontSize: 14, color: "#fff" }, children: "STANDBY COCKPIT" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: /* @__PURE__ */ jsxs(
              "a",
              {
                href: "tel:+12015550199",
                className: "driver-tool-btn",
                style: { background: "#0284c7", color: "#fff", border: 0, fontWeight: 800 },
                children: [
                  /* @__PURE__ */ jsx(Phone, { size: 13 }),
                  " Dispatch Office"
                ]
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "driver-driveview-hud", children: [
            /* @__PURE__ */ jsxs("div", { className: "driver-hud-destination", children: [
              /* @__PURE__ */ jsxs("div", { className: "driver-hud-dest-label", children: [
                /* @__PURE__ */ jsx(MapPin, { size: 15, color: "#38bdf8" }),
                /* @__PURE__ */ jsx("span", { children: "CHAUFFEUR STATUS" }),
                /* @__PURE__ */ jsxs("span", { className: "driver-time-pill", style: { color: "#4ade80" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "driver-duty-dot", style: { background: "#22c55e" } }),
                  " On Duty (",
                  gpsLabel,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx("h2", { className: "driver-hud-dest-address", children: "Awaiting Next Dispatch Assignment" }),
              /* @__PURE__ */ jsx("p", { style: { margin: "0 0 12px", fontSize: 13, color: "#94a3b8", lineHeight: 1.4 }, children: "Your vehicle is connected live to Central Dispatch. When an assignment is sent, your HUD navigation activates automatically." }),
              /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr", gap: 8 }, children: /* @__PURE__ */ jsxs(
                "a",
                {
                  href: "tel:+12015550199",
                  className: "driver-hud-nav-btn google",
                  style: { padding: "12px 14px", fontSize: 14 },
                  children: [
                    /* @__PURE__ */ jsx(Phone, { size: 16 }),
                    " Call Dispatch Office (201) 555-0199"
                  ]
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "driver-hud-big-action done", style: { background: "#131d2e", border: "1px solid #1e293b", color: "#38bdf8" }, children: [
              /* @__PURE__ */ jsx(Sparkles, { size: 18 }),
              " READY FOR DISPATCH ASSIGNMENT"
            ] })
          ] })
        ] });
      }
      const stage = getTripStage(t);
      const isPickupTarget = stage <= 2;
      const targetAddress = isPickupTarget ? t.pickup : t.dropoff;
      const targetLabel = isPickupTarget ? "Passenger Pickup" : "Passenger Dropoff";
      const isBusy = actingTripId === t.id;
      const isNoteBusy = savingNoteId === t.id;
      const isNoteSaved = savedNoteId === t.id;
      const currentDraft = notesDraft[t.id] ?? t.driverNotes ?? "";
      const tw = getTripTimeWindow(t.pickupAt, nowMs);
      return /* @__PURE__ */ jsxs("div", { className: "driver-driveview-modal", role: "dialog", "aria-modal": "true", "aria-label": "Chauffeur Drive View", children: [
        driveMenuOpen && /* @__PURE__ */ jsx(
          "div",
          {
            className: "trip-scrim",
            style: { zIndex: 1e5, background: "rgba(0,0,0,0.65)" },
            onClick: () => setDriveMenuOpen(false),
            children: /* @__PURE__ */ jsxs("div", { className: "driver-drivemenu-drawer", onClick: (e) => e.stopPropagation(), children: [
              /* @__PURE__ */ jsxs("div", { className: "driver-drivemenu-head", children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                  /* @__PURE__ */ jsx("span", { className: "fleet-live-pulse" }),
                  /* @__PURE__ */ jsx("strong", { style: { fontSize: 15, color: "#38bdf8" }, children: "Driver View Menu" })
                ] }),
                /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setDriveMenuOpen(false), "aria-label": "Close menu", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "driver-drivemenu-body", children: [
                /* @__PURE__ */ jsxs("div", { className: "driver-drivemenu-section", children: [
                  /* @__PURE__ */ jsx("span", { className: "driver-drivemenu-label", children: "Switch Mission / Assigned Rides" }),
                  sorted.filter((x) => getTripStage(x) < 4).length === 0 ? /* @__PURE__ */ jsx("p", { style: { fontSize: 12, color: "#94a3b8", margin: 0 }, children: "No other active trips." }) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: sorted.filter((x) => getTripStage(x) < 4).map((trip) => /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      className: `driver-drivemenu-item${trip.id === driveViewTripId ? " active" : ""}`,
                      onClick: () => {
                        setDriveViewTripId(trip.id);
                        setDriveMenuOpen(false);
                      },
                      children: [
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("strong", { children: trip.name || "Guest" }),
                          /* @__PURE__ */ jsxs("small", { children: [
                            clock$1(trip.pickupAt),
                            " · ",
                            trip.pickup?.slice(0, 22),
                            "…"
                          ] })
                        ] }),
                        trip.id === driveViewTripId && /* @__PURE__ */ jsx(Check, { size: 16, color: "#38bdf8" })
                      ]
                    },
                    trip.id
                  )) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "driver-drivemenu-section", children: [
                  /* @__PURE__ */ jsx("span", { className: "driver-drivemenu-label", children: "Turn-by-Turn GPS Navigation" }),
                  /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: targetAddress && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsxs(
                      "a",
                      {
                        href: googleMapsUrl(targetAddress),
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "driver-drivemenu-link",
                        onClick: () => setDriveMenuOpen(false),
                        children: [
                          /* @__PURE__ */ jsx(Navigation, { size: 15, color: "#3b82f6" }),
                          " Launch Google Maps"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "a",
                      {
                        href: wazeUrl(targetAddress),
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "driver-drivemenu-link",
                        onClick: () => setDriveMenuOpen(false),
                        children: [
                          /* @__PURE__ */ jsx(Compass, { size: 15, color: "#0284c7" }),
                          " Launch Waze"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "a",
                      {
                        href: appleMapsUrl(targetAddress),
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "driver-drivemenu-link",
                        onClick: () => setDriveMenuOpen(false),
                        children: [
                          /* @__PURE__ */ jsx(Navigation, { size: 15, color: "#94a3b8" }),
                          " Launch Apple Maps"
                        ]
                      }
                    )
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "driver-drivemenu-section", children: [
                  /* @__PURE__ */ jsx("span", { className: "driver-drivemenu-label", children: "Quick Contacts" }),
                  /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
                    t.phone && /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsxs("a", { href: `tel:${t.phone.replace(/[^\d+]/g, "")}`, className: "driver-drivemenu-link", children: [
                        /* @__PURE__ */ jsx(Phone, { size: 15, color: "#22c55e" }),
                        " Call Passenger (",
                        t.phone,
                        ")"
                      ] }),
                      /* @__PURE__ */ jsxs("a", { href: `sms:${t.phone.replace(/[^\d+]/g, "")}`, className: "driver-drivemenu-link", children: [
                        /* @__PURE__ */ jsx(MessageSquare, { size: 15, color: "#38bdf8" }),
                        " SMS Passenger"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("a", { href: "tel:+12015550199", className: "driver-drivemenu-link", children: [
                      /* @__PURE__ */ jsx(Phone, { size: 15, color: "#eab308" }),
                      " Call Central Dispatch (Office)"
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "driver-drivemenu-section", children: [
                  /* @__PURE__ */ jsx("span", { className: "driver-drivemenu-label", children: "Mission Center" }),
                  /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        className: "driver-drivemenu-link",
                        onClick: () => {
                          setDriveMenuOpen(false);
                          setDriveViewTripId(null);
                          setActiveTab("all");
                        },
                        children: [
                          /* @__PURE__ */ jsx(CheckCircle2, { size: 15 }),
                          " All Trips Schedule"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        className: "driver-drivemenu-link",
                        onClick: () => {
                          setDriveMenuOpen(false);
                          setDriveViewTripId(null);
                          setActiveTab("settings");
                        },
                        children: [
                          /* @__PURE__ */ jsx(Settings, { size: 15 }),
                          " Chauffeur Profile & Vehicle"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        className: "driver-drivemenu-link",
                        style: { color: "#ef4444" },
                        onClick: () => {
                          setDriveMenuOpen(false);
                          signOut();
                        },
                        children: [
                          /* @__PURE__ */ jsx(LogOut, { size: 15 }),
                          " Sign Out (Chauffeur Portal)"
                        ]
                      }
                    )
                  ] })
                ] })
              ] })
            ] })
          }
        ),
        /* @__PURE__ */ jsxs("header", { className: "driver-driveview-topbar", children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, marginRight: 4 }, children: [
              /* @__PURE__ */ jsxs("span", { className: "brand-mark", style: { width: 24, height: 24, fontSize: 11, borderRadius: 6 }, children: [
                "E",
                /* @__PURE__ */ jsx("span", { children: "L" })
              ] }),
              /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 900, color: "#fff", letterSpacing: ".04em" }, children: "ELITELIMOLINK" })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: "driver-tool-btn",
                style: { background: "#2563eb", color: "#fff", border: 0, fontWeight: 800 },
                onClick: () => setDriveMenuOpen(true),
                "aria-label": "Open Driver View Menu",
                children: [
                  /* @__PURE__ */ jsx(Menu, { size: 16 }),
                  " Driver Menu"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: "driver-tool-btn",
                style: { background: "#1e293b", color: "#cbd5e1", border: "1px solid #334155" },
                onClick: () => {
                  setDriveViewTripId(null);
                  setActiveTab("all");
                },
                title: "View All Scheduled Trips",
                children: [
                  /* @__PURE__ */ jsx(Calendar, { size: 14 }),
                  " All Trips"
                ]
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: "driver-wakelock-pill", title: "Screen Wake Lock is active", children: [
              /* @__PURE__ */ jsx(SunMedium, { size: 12 }),
              " ",
              screenAwake ? "Screen Awake" : "Wake Ready"
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
              /* @__PURE__ */ jsx("span", { className: "fleet-live-pulse" }),
              /* @__PURE__ */ jsx("strong", { style: { fontSize: 14, color: "#fff" }, children: t.name || "Guest" }),
              t.sourceName && /* @__PURE__ */ jsx("span", { className: "driver-brand-tag", children: t.sourceName })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: t.phone && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(
              "a",
              {
                href: `tel:${t.phone.replace(/[^\d+]/g, "")}`,
                className: "driver-tool-btn",
                style: { background: "#2563eb", color: "#fff", border: 0, fontWeight: 800, padding: "6px 10px" },
                children: [
                  /* @__PURE__ */ jsx(Phone, { size: 13 }),
                  " Call"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "a",
              {
                href: `sms:${t.phone.replace(/[^\d+]/g, "")}`,
                className: "driver-tool-btn",
                style: { background: "#0284c7", color: "#fff", border: 0, fontWeight: 800, padding: "6px 10px" },
                children: [
                  /* @__PURE__ */ jsx(MessageSquare, { size: 13 }),
                  " SMS"
                ]
              }
            )
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "driver-driveview-hud", children: [
          actionError && /* @__PURE__ */ jsxs(
            "div",
            {
              role: "alert",
              style: {
                padding: "10px 14px",
                background: "rgba(239, 68, 68, 0.2)",
                border: "1.5px solid #ef4444",
                borderRadius: 10,
                color: "#fecaca",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8
              },
              children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  "⚠️ ",
                  actionError
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setActionError(""),
                    style: { border: 0, background: "transparent", color: "#fca5a5", cursor: "pointer" },
                    "aria-label": "Dismiss error",
                    children: /* @__PURE__ */ jsx(X, { size: 15 })
                  }
                )
              ]
            }
          ),
          smsBanner && smsBanner.tripId === t.id && /* @__PURE__ */ jsxs(
            "div",
            {
              role: "status",
              style: {
                padding: "12px 14px",
                background: smsBanner.status === "arrived" ? "rgba(22, 163, 74, 0.2)" : "rgba(37, 99, 235, 0.22)",
                border: `1.5px solid ${smsBanner.status === "arrived" ? "#22c55e" : "#3b82f6"}`,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap"
              },
              children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
                  /* @__PURE__ */ jsx(MessageSquare, { size: 18, color: smsBanner.status === "arrived" ? "#4ade80" : "#60a5fa" }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, fontWeight: 800, color: smsBanner.status === "arrived" ? "#4ade80" : "#93c5fd", textTransform: "uppercase", letterSpacing: ".05em" }, children: [
                      "✓ Automated SMS Dispatched to ",
                      smsBanner.customerName,
                      smsBanner.phone ? ` (${smsBanner.phone})` : "",
                      " • ",
                      smsBanner.sentAt
                    ] }),
                    /* @__PURE__ */ jsxs("div", { style: { fontSize: 15, fontWeight: 800, color: "#ffffff", marginTop: 2 }, children: [
                      "“",
                      smsBanner.message,
                      "”"
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                  smsBanner.phone && /* @__PURE__ */ jsxs(
                    "a",
                    {
                      href: smsBodyUrl(smsBanner.phone, smsBanner.message),
                      className: "driver-tool-btn",
                      style: { background: "#0284c7", color: "#fff", border: 0, fontWeight: 800, padding: "6px 10px", fontSize: 11 },
                      children: [
                        /* @__PURE__ */ jsx(MessageSquare, { size: 12 }),
                        " Send via Phone SMS"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setSmsBanner(null),
                      style: { border: 0, background: "transparent", cursor: "pointer", color: "#94a3b8", padding: 4 },
                      "aria-label": "Dismiss SMS banner",
                      children: /* @__PURE__ */ jsx(X, { size: 16 })
                    }
                  )
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "driver-hud-destination", children: [
            /* @__PURE__ */ jsxs("div", { className: "driver-hud-dest-label", children: [
              /* @__PURE__ */ jsx(MapPin, { size: 15, color: "#38bdf8" }),
              /* @__PURE__ */ jsx("span", { children: targetLabel }),
              t.flight && /* @__PURE__ */ jsxs("span", { className: "driver-flight-pill", children: [
                "Flight: ",
                t.flight
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "driver-time-pill", children: [
                /* @__PURE__ */ jsx(Clock, { size: 11 }),
                " ",
                clock$1(t.pickupAt),
                " (",
                tw.pickupCountdownLabel,
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsx("h2", { className: "driver-hud-dest-address", children: targetAddress || "Address to be confirmed" }),
            t.extraStop && /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: "#facc15", marginBottom: 10 }, children: [
              "⚠️ Extra Stop: ",
              t.extraStop
            ] }),
            targetAddress && /* @__PURE__ */ jsxs("div", { className: "driver-hud-nav-buttons", children: [
              /* @__PURE__ */ jsxs(
                "a",
                {
                  href: googleMapsUrl(targetAddress),
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "driver-hud-nav-btn google",
                  children: [
                    /* @__PURE__ */ jsx(Navigation, { size: 15 }),
                    " Google"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "a",
                {
                  href: wazeUrl(targetAddress),
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "driver-hud-nav-btn waze",
                  children: [
                    /* @__PURE__ */ jsx(Compass, { size: 15 }),
                    " Waze"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "a",
                {
                  href: appleMapsUrl(targetAddress),
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "driver-hud-nav-btn apple",
                  children: [
                    /* @__PURE__ */ jsx(Navigation, { size: 15 }),
                    " Apple"
                  ]
                }
              )
            ] })
          ] }),
          (() => {
            const tripSms = smsSentLog[t.id] || {};
            const onTheWaySent = stage >= 1 || Boolean(tripSms.on_the_way);
            const arrivedSent = stage >= 2 || Boolean(tripSms.arrived);
            return /* @__PURE__ */ jsxs(
              "div",
              {
                style: {
                  background: "#131d2e",
                  border: "1px solid #1e293b",
                  borderRadius: 12,
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8
                },
                children: [
                  /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }, children: [
                    /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: 6 }, children: [
                      /* @__PURE__ */ jsx(MessageSquare, { size: 13 }),
                      " Status & Automated Customer SMS"
                    ] }),
                    /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: "#94a3b8" }, children: [
                      t.name || "Customer",
                      t.phone ? ` • ${t.phone}` : ""
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }, children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        disabled: isBusy || !tw.canUpdateOnTheWay,
                        onClick: () => handleTripAction(t.id, "on_the_way"),
                        style: {
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: stage === 1 ? "2px solid #38bdf8" : "1px solid #334155",
                          background: !tw.canUpdateOnTheWay ? "#0f172a" : onTheWaySent ? "rgba(37, 99, 235, 0.28)" : "#1e293b",
                          color: "#fff",
                          cursor: !tw.canUpdateOnTheWay ? "not-allowed" : "pointer",
                          opacity: !tw.canUpdateOnTheWay ? 0.65 : 1,
                          textAlign: "left",
                          display: "flex",
                          flexDirection: "column",
                          gap: 3
                        },
                        children: [
                          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }, children: [
                            /* @__PURE__ */ jsxs("span", { style: { fontSize: 12, fontWeight: 800, color: "#60a5fa" }, children: [
                              !tw.canUpdateOnTheWay ? "🔒" : "🚗",
                              " Status: On the Way"
                            ] }),
                            /* @__PURE__ */ jsx("span", { style: { fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 6, background: onTheWaySent ? "#2563eb" : "#334155", color: "#fff" }, children: onTheWaySent ? "✓ SMS SENT" : !tw.canUpdateOnTheWay ? "≤ 1 HR PRIOR" : "AUTO-SMS" })
                          ] }),
                          /* @__PURE__ */ jsx("span", { style: { fontSize: 12, fontWeight: 600, color: "#e2e8f0" }, children: "“Your driver is on the way.”" }),
                          /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: tw.canUpdateOnTheWay ? "#4ade80" : "#fbbf24", fontWeight: 700 }, children: tw.onTheWayWaitLabel })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        disabled: isBusy || !tw.canUpdateArrived,
                        onClick: () => handleTripAction(t.id, "arrive"),
                        style: {
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: stage === 2 ? "2px solid #4ade80" : "1px solid #334155",
                          background: !tw.canUpdateArrived ? "#0f172a" : arrivedSent ? "rgba(22, 163, 74, 0.28)" : "#1e293b",
                          color: "#fff",
                          cursor: !tw.canUpdateArrived ? "not-allowed" : "pointer",
                          opacity: !tw.canUpdateArrived ? 0.65 : 1,
                          textAlign: "left",
                          display: "flex",
                          flexDirection: "column",
                          gap: 3
                        },
                        children: [
                          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }, children: [
                            /* @__PURE__ */ jsxs("span", { style: { fontSize: 12, fontWeight: 800, color: "#4ade80" }, children: [
                              !tw.canUpdateArrived ? "🔒" : "📍",
                              " Status: Arrived"
                            ] }),
                            /* @__PURE__ */ jsx("span", { style: { fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 6, background: arrivedSent ? "#16a34a" : "#334155", color: "#fff" }, children: arrivedSent ? "✓ SMS SENT" : !tw.canUpdateArrived ? "≤ 25 MIN PRIOR" : "AUTO-SMS" })
                          ] }),
                          /* @__PURE__ */ jsx("span", { style: { fontSize: 12, fontWeight: 600, color: "#e2e8f0" }, children: "“Your driver has arrived.”" }),
                          /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: tw.canUpdateArrived ? "#4ade80" : "#fbbf24", fontWeight: 700 }, children: tw.arrivedWaitLabel })
                        ]
                      }
                    )
                  ] })
                ]
              }
            );
          })(),
          /* @__PURE__ */ jsxs("div", { children: [
            stage === 0 && /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: "driver-hud-big-action accept",
                disabled: isBusy || !tw.canUpdateOnTheWay,
                onClick: () => handleTripAction(t.id, "on_the_way"),
                style: !tw.canUpdateOnTheWay ? { background: "#334155", cursor: "not-allowed", opacity: 0.85 } : void 0,
                children: [
                  isBusy ? /* @__PURE__ */ jsx(Loader2, { size: 20, className: "animate-spin" }) : !tw.canUpdateOnTheWay ? /* @__PURE__ */ jsx(LockKeyhole, { size: 20 }) : /* @__PURE__ */ jsx(Navigation, { size: 20, strokeWidth: 3 }),
                  tw.canUpdateOnTheWay ? "ON THE WAY — SEND “YOUR DRIVER IS ON THE WAY.”" : `ON THE WAY LOCKED • ${tw.onTheWayWaitLabel.toUpperCase()}`
                ]
              }
            ),
            stage === 1 && /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: "driver-hud-big-action arrive",
                disabled: isBusy || !tw.canUpdateArrived,
                onClick: () => handleTripAction(t.id, "arrive"),
                style: !tw.canUpdateArrived ? { background: "#334155", cursor: "not-allowed", opacity: 0.85 } : void 0,
                children: [
                  isBusy ? /* @__PURE__ */ jsx(Loader2, { size: 20, className: "animate-spin" }) : !tw.canUpdateArrived ? /* @__PURE__ */ jsx(LockKeyhole, { size: 20 }) : /* @__PURE__ */ jsx(MapPin, { size: 20, strokeWidth: 3 }),
                  tw.canUpdateArrived ? "I’VE ARRIVED — SEND “YOUR DRIVER HAS ARRIVED.”" : `ARRIVED LOCKED • ${tw.arrivedWaitLabel.toUpperCase()}`
                ]
              }
            ),
            stage === 2 && /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: "driver-hud-big-action pickup",
                disabled: isBusy,
                onClick: () => handleTripAction(t.id, "pickup"),
                children: [
                  isBusy ? /* @__PURE__ */ jsx(Loader2, { size: 20, className: "animate-spin" }) : /* @__PURE__ */ jsx(UserCheck, { size: 20, strokeWidth: 3 }),
                  "PASSENGER ON BOARD (TO DROPOFF)"
                ]
              }
            ),
            stage === 3 && /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: "driver-hud-big-action dropoff",
                disabled: isBusy,
                onClick: () => handleTripAction(t.id, "dropoff"),
                children: [
                  isBusy ? /* @__PURE__ */ jsx(Loader2, { size: 20, className: "animate-spin" }) : /* @__PURE__ */ jsx(Flag, { size: 20, strokeWidth: 3 }),
                  "COMPLETE TRIP (DROPPED OFF)"
                ]
              }
            ),
            stage === 4 && /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
              /* @__PURE__ */ jsxs("div", { className: "driver-hud-big-action done", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 20 }),
                " TRIP COMPLETED SUCCESSFULLY"
              ] }),
              (() => {
                const nextTrip = sorted.find((x) => x.id !== t.id && getTripStage(x) < 4);
                if (nextTrip) {
                  return /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      className: "driver-hud-big-action accept",
                      onClick: () => setDriveViewTripId(nextTrip.id),
                      children: [
                        /* @__PURE__ */ jsx(Navigation, { size: 18 }),
                        " NEXT MISSION: ",
                        nextTrip.name || "Guest",
                        " (",
                        clock$1(nextTrip.pickupAt),
                        ")"
                      ]
                    }
                  );
                }
                return /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    className: "driver-hud-big-action arrive",
                    style: { background: "#1e293b", border: "1px solid #334155" },
                    onClick: () => {
                      setDriveViewTripId(null);
                      setActiveTab("drive");
                    },
                    children: [
                      /* @__PURE__ */ jsx(Compass, { size: 18 }),
                      " RETURN TO STANDBY COCKPIT"
                    ]
                  }
                );
              })()
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "driver-hud-notes-box", children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }, children: [
              /* @__PURE__ */ jsx("span", { style: { fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "#94a3b8" }, children: "Trip Notes & Tolls" }),
              t.driverNotes && /* @__PURE__ */ jsx("span", { style: { color: "#4ade80", fontSize: 11 }, children: "✓ Saved" })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  className: "driver-note-textarea",
                  style: { background: "#090d16", borderColor: "#334155", color: "#fff", minHeight: "auto", height: 38, padding: "6px 10px", fontSize: 13, flex: 1 },
                  value: currentDraft,
                  onChange: (e) => setNotesDraft((prev) => ({ ...prev, [t.id]: e.target.value })),
                  placeholder: "Toll receipts, luggage, delay notes..."
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: `driver-note-save-btn${isNoteSaved ? " saved" : ""}`,
                  style: { marginTop: 0, padding: "0 14px", height: 38, whiteSpace: "nowrap" },
                  disabled: isNoteBusy,
                  onClick: () => handleSaveNote(t.id),
                  children: [
                    isNoteBusy ? /* @__PURE__ */ jsx(Loader2, { size: 13, className: "animate-spin" }) : /* @__PURE__ */ jsx(Save, { size: 13 }),
                    isNoteSaved ? "Saved!" : "Save"
                  ]
                }
              )
            ] })
          ] })
        ] })
      ] });
    })(),
    /* @__PURE__ */ jsx(
      "video",
      {
        playsInline: true,
        muted: true,
        loop: true,
        autoPlay: true,
        style: { position: "fixed", top: -100, left: -100, width: 1, height: 1, opacity: 1e-3, pointerEvents: "none" },
        src: "data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAADpmcmVlAAAAG21kYXQAAAGzAAABt///wAAAAAg="
      }
    )
  ] });
}
function meta$6({
  matches,
  location
}) {
  return seo({
    matches,
    location
  }, {
    title: "Driver Area | ELITELIMOLINK",
    description: "View your assigned trips and manage your driver profile.",
    noindex: true
  });
}
function clientLoader$4() {
  return {
    driver: requireDriverAuth()
  };
}
clientLoader$4.hydrate = true;
const HydrateFallback$4 = UNSAFE_withHydrateFallbackProps(function HydrateFallback() {
  return /* @__PURE__ */ jsx("div", {
    className: "dashboard-loading"
  });
});
const driver = UNSAFE_withComponentProps(function DriverPage({
  loaderData
}) {
  return /* @__PURE__ */ jsx(DriverBoard, {
    driverId: loaderData.driver?.id ?? "",
    driverEmail: loaderData.driver?.email ?? ""
  });
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  HydrateFallback: HydrateFallback$4,
  clientLoader: clientLoader$4,
  default: driver,
  meta: meta$6
}, Symbol.toStringTag, { value: "Module" }));
function DriverSignIn() {
  const { login: login2 } = useDriverAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgot, setForgot] = useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await login2(email.trim().toLowerCase(), password);
      navigate("/driver");
    } catch {
      setError("That email or password didn’t match. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }
  return /* @__PURE__ */ jsxs("main", { className: "auth-page", children: [
    /* @__PURE__ */ jsx("div", { className: "ambient ambient-one" }),
    /* @__PURE__ */ jsx("div", { className: "ambient ambient-two" }),
    /* @__PURE__ */ jsxs("a", { href: "/driver/login", className: "page-brand", style: { textDecoration: "none" }, children: [
      /* @__PURE__ */ jsxs("span", { className: "brand-mark", children: [
        "E",
        /* @__PURE__ */ jsx("span", { children: "L" })
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "brand-word", children: [
        "ELITELIMOLINK",
        /* @__PURE__ */ jsx("span", { className: "brand-sub", children: " / CHAUFFEUR" })
      ] })
    ] }),
    forgot ? /* @__PURE__ */ jsxs("div", { className: "auth-card", children: [
      /* @__PURE__ */ jsx(ThemeToggle, { className: "theme-toggle card-theme" }),
      /* @__PURE__ */ jsx(ForgotPassword, { collection: "drivers", onCancel: () => setForgot(false) })
    ] }) : /* @__PURE__ */ jsxs("form", { className: "auth-card", onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsx(ThemeToggle, { className: "theme-toggle card-theme" }),
      /* @__PURE__ */ jsxs("div", { className: "auth-head", children: [
        /* @__PURE__ */ jsx("span", { className: "auth-icon", children: /* @__PURE__ */ jsx(LockKeyhole, { size: 20 }) }),
        /* @__PURE__ */ jsx("h1", { children: "Driver sign in" }),
        /* @__PURE__ */ jsx("p", { children: "View your assigned trips and manage your profile." })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
        "Email address",
        /* @__PURE__ */ jsx("span", { className: "required", children: "*" }),
        /* @__PURE__ */ jsx("input", { className: "standard-input", type: "email", autoComplete: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
        "Password",
        /* @__PURE__ */ jsx("span", { className: "required", children: "*" }),
        /* @__PURE__ */ jsx("input", { className: "standard-input", type: "password", autoComplete: "current-password", value: password, onChange: (e) => setPassword(e.target.value), required: true })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", children: error }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "primary-button", disabled: submitting, children: submitting ? "Signing in…" : /* @__PURE__ */ jsxs(Fragment, { children: [
        "Sign in ",
        /* @__PURE__ */ jsx(ArrowRight, { size: 17 })
      ] }) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "auth-forgot", onClick: () => {
        setForgot(true);
        setError("");
      }, children: "Forgot password?" }),
      /* @__PURE__ */ jsx("a", { className: "auth-switch", href: "/driver/register", children: "New driver? Create your account" }),
      /* @__PURE__ */ jsx("p", { className: "auth-footnote", children: "Driver access is separate from operator access." })
    ] })
  ] });
}
function meta$5({
  matches,
  location
}) {
  return seo({
    matches,
    location
  }, {
    title: "Driver Sign In | ELITELIMOLINK",
    description: "Drivers sign in to view assigned trips and manage their profile.",
    noindex: true
  });
}
function clientLoader$3() {
  const record = pocketbaseClient.authStore.record;
  if (pocketbaseClient.authStore.isValid && record?.collectionName === "drivers") {
    throw redirect("/driver");
  }
  return null;
}
clientLoader$3.hydrate = true;
const HydrateFallback$3 = UNSAFE_withHydrateFallbackProps(function HydrateFallback2() {
  return null;
});
const driver_login = UNSAFE_withComponentProps(function DriverLoginPage() {
  return /* @__PURE__ */ jsx(DriverSignIn, {});
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  HydrateFallback: HydrateFallback$3,
  clientLoader: clientLoader$3,
  default: driver_login,
  meta: meta$5
}, Symbol.toStringTag, { value: "Module" }));
function DriverSignUp() {
  const { signup } = useDriverAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("sedan");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    if (password.length < 8) {
      setError("Choose a password of at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await signup(email.trim().toLowerCase(), password, {
        name: name.trim(),
        phone: phone.trim(),
        vehicle,
        active: true
      });
      navigate("/driver");
    } catch (err) {
      const data2 = err?.response?.data;
      const emailMsg = data2?.email?.message;
      const passwordMsg = data2?.password?.message;
      setError(
        emailMsg ? `Email: ${emailMsg}` : passwordMsg ? `Password: ${passwordMsg}` : "Couldn’t create your driver account. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }
  return /* @__PURE__ */ jsxs("main", { className: "auth-page", children: [
    /* @__PURE__ */ jsx("div", { className: "ambient ambient-one" }),
    /* @__PURE__ */ jsx("div", { className: "ambient ambient-two" }),
    /* @__PURE__ */ jsxs("a", { href: "/driver/login", className: "page-brand", style: { textDecoration: "none" }, children: [
      /* @__PURE__ */ jsxs("span", { className: "brand-mark", children: [
        "E",
        /* @__PURE__ */ jsx("span", { children: "L" })
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "brand-word", children: [
        "ELITELIMOLINK",
        /* @__PURE__ */ jsx("span", { className: "brand-sub", children: " / CHAUFFEUR" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { className: "auth-card", onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsx(ThemeToggle, { className: "theme-toggle card-theme" }),
      /* @__PURE__ */ jsxs("div", { className: "auth-head", children: [
        /* @__PURE__ */ jsx("span", { className: "auth-icon", children: /* @__PURE__ */ jsx(UserPlus, { size: 20 }) }),
        /* @__PURE__ */ jsx("h1", { children: "Create your driver account" }),
        /* @__PURE__ */ jsx("p", { children: "Set up your own sign-in and choose your own password. An operator will assign trips to you." })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
        "Full name",
        /* @__PURE__ */ jsx("span", { className: "required", children: "*" }),
        /* @__PURE__ */ jsx("input", { className: "standard-input", type: "text", autoComplete: "name", placeholder: "Your name", value: name, onChange: (e) => setName(e.target.value), required: true })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
        "Email address",
        /* @__PURE__ */ jsx("span", { className: "required", children: "*" }),
        /* @__PURE__ */ jsx("input", { className: "standard-input", type: "email", autoComplete: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
        "Phone",
        /* @__PURE__ */ jsx("span", { className: "optional", children: "optional" }),
        /* @__PURE__ */ jsx("input", { className: "standard-input", type: "tel", autoComplete: "tel", placeholder: "Mobile number", value: phone, onChange: (e) => setPhone(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
        "Preferred vehicle",
        /* @__PURE__ */ jsx("span", { className: "optional", children: "optional" }),
        /* @__PURE__ */ jsx("select", { className: "standard-input", value: vehicle, onChange: (e) => setVehicle(e.target.value), children: vehicles.map((v) => /* @__PURE__ */ jsx("option", { value: v.id, children: v.name }, v.id)) })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
        "Create a password",
        /* @__PURE__ */ jsx("span", { className: "required", children: "*" }),
        /* @__PURE__ */ jsx("input", { className: "standard-input", type: "password", autoComplete: "new-password", minLength: 8, value: password, onChange: (e) => setPassword(e.target.value), required: true })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", children: error }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "primary-button", disabled: submitting, children: submitting ? "Creating…" : /* @__PURE__ */ jsxs(Fragment, { children: [
        "Create account ",
        /* @__PURE__ */ jsx(ArrowRight, { size: 17 })
      ] }) }),
      /* @__PURE__ */ jsx("a", { className: "auth-switch", href: "/driver/login", children: "Already have a driver account? Sign in" }),
      /* @__PURE__ */ jsx("p", { className: "auth-footnote", children: "You choose and control your own password." })
    ] })
  ] });
}
function meta$4({
  matches,
  location
}) {
  return seo({
    matches,
    location
  }, {
    title: "Driver Registration | ELITELIMOLINK",
    description: "Create your driver account and choose your own password to start receiving trip assignments.",
    noindex: true
  });
}
function clientLoader$2() {
  const record = pocketbaseClient.authStore.record;
  if (pocketbaseClient.authStore.isValid && record?.collectionName === "drivers") {
    throw redirect("/driver");
  }
  return null;
}
clientLoader$2.hydrate = true;
const HydrateFallback$2 = UNSAFE_withHydrateFallbackProps(function HydrateFallback3() {
  return null;
});
const driver_register = UNSAFE_withComponentProps(function DriverRegisterPage() {
  return /* @__PURE__ */ jsx(DriverSignUp, {});
});
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  HydrateFallback: HydrateFallback$2,
  clientLoader: clientLoader$2,
  default: driver_register,
  meta: meta$4
}, Symbol.toStringTag, { value: "Module" }));
function isPbAuthError(err) {
  if (!err || typeof err !== "object") return false;
  const e = err;
  const status = e.status;
  if (status === 401 || status === 403) return true;
  if (status === 400) {
    const data2 = e.response?.data;
    const dataEmpty = !data2 || typeof data2 === "object" && Object.keys(data2).length === 0;
    const msg = e.response?.message || e.message || "";
    if (dataEmpty && /Failed to (create|update|delete) record/i.test(msg)) {
      return true;
    }
  }
  return false;
}
function handlePbAuthError(err) {
  if (!isPbAuthError(err)) return false;
  try {
    pocketbaseClient.authStore.clear();
  } catch {
  }
  if (typeof window !== "undefined") {
    window.location.assign("/login?expired=1");
  }
  return true;
}
function useVehicleTiers() {
  const [tiers, setTiers] = useState(DEFAULT_TIERS);
  useEffect(() => {
    let active = true;
    pocketbaseClient.collection("vehicle_tiers").getFullList({ sort: "sort", requestKey: null }).then((rows) => {
      if (!active || !rows.length) return;
      const mapped = rows.filter((r) => r.active !== false).map((r) => ({
        key: r.key ?? "",
        name: r.name ?? r.key ?? "",
        detail: r.detail ?? "",
        capacity: r.capacity ?? 3,
        minFare: r.minFare ?? 0,
        multiplier: r.multiplier ?? 1,
        perMileRate: r.perMileRate ?? 0,
        active: r.active !== false,
        sort: r.sort ?? 0
      }));
      if (mapped.length) setTiers(mapped);
    }).catch(() => {
    });
    return () => {
      active = false;
    };
  }, []);
  return tiers;
}
function useVehicleTierName() {
  const tiers = useVehicleTiers();
  return (key) => tiers.find((t) => t.key === key)?.name ?? key;
}
const CARD_LABELS = {
  VISA: "Visa",
  MASTERCARD: "Mastercard",
  AMEX: "American Express",
  AMERICAN_EXPRESS: "American Express",
  DISCOVER: "Discover",
  JCB: "JCB",
  UNIONPAY: "UnionPay",
  OTHER_BRAND: "Card"
};
function brandLabel(brand) {
  if (!brand) return "";
  return CARD_LABELS[brand.toUpperCase()] ?? brand;
}
function statusLabel(status) {
  switch ((status || "").toUpperCase()) {
    case "COMPLETED":
      return "Captured";
    case "AUTHORIZED":
    case "APPROVED":
      return "Authorized (hold placed)";
    case "PENDING":
      return "Pending";
    case "CANCELED":
      return "Canceled";
    case "FAILED":
      return "Failed";
    case "NONE":
      return "No payment on file";
    default:
      return status || "Unknown";
  }
}
function statusTone(status) {
  switch ((status || "").toUpperCase()) {
    case "COMPLETED":
      return "captured";
    case "AUTHORIZED":
    case "APPROVED":
    case "PENDING":
      return "authorized";
    case "FAILED":
    case "CANCELED":
      return "failed";
    default:
      return "none";
  }
}
function moneyText(amount, currency) {
  if (amount == null) return "";
  const cents = Number(amount);
  if (!Number.isFinite(cents)) return "";
  const value = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD"
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}
function PaymentManagement({
  reservationId,
  squareOrderId,
  paid,
  captured,
  fareText,
  onCaptured
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState("");
  const [captureDone, setCaptureDone] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!paid && !squareOrderId) {
      setDetails(null);
      return;
    }
    setLoading(true);
    setCaptureError("");
    setCaptureDone(false);
    fetch("/api/square-payment-details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pocketbaseClient.authStore.token}`
      },
      body: JSON.stringify({ ref: reservationId })
    }).then((res) => res.json().catch(() => ({}))).then((data2) => {
      if (!cancelled) setDetails(data2);
    }).catch(() => {
      if (!cancelled) setDetails(null);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [reservationId, paid, squareOrderId]);
  async function capturePayment() {
    if (capturing) return;
    setCapturing(true);
    setCaptureError("");
    setCaptureDone(false);
    try {
      const res = await fetch("/api/square-capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pocketbaseClient.authStore.token}`
        },
        body: JSON.stringify({ ref: reservationId })
      });
      const data2 = await res.json().catch(() => ({}));
      if (res.ok && data2?.ok) {
        setCaptureDone(true);
        onCaptured();
      } else if (data2?.needsConfiguration) {
        setCaptureError(
          "Square is not configured to capture payments. Add your Square access token to enable capture."
        );
      } else {
        setCaptureError(data2?.message || "The payment could not be captured. Please try again.");
      }
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setCaptureError("We couldn't reach the capture service. Please try again.");
    } finally {
      setCapturing(false);
    }
  }
  const needsConfig = !!details?.needsConfiguration;
  const effectiveCaptured = captured || !!details?.captured || (details?.status || "").toUpperCase() === "COMPLETED";
  const effectivePaid = paid || !!details?.paid;
  const status = details?.status ?? (effectivePaid ? effectiveCaptured ? "COMPLETED" : "AUTHORIZED" : "NONE");
  const tone = statusTone(status);
  const amountText = moneyText(details?.amount, details?.currency);
  const hasCard = !!details?.cardBrand || !!details?.last4;
  return /* @__PURE__ */ jsxs("div", { className: "payment-mgmt", children: [
    /* @__PURE__ */ jsxs("div", { className: "payment-mgmt-head", children: [
      /* @__PURE__ */ jsxs("span", { className: "payment-mgmt-title", children: [
        /* @__PURE__ */ jsx(CreditCard, { size: 15 }),
        " Payment management"
      ] }),
      /* @__PURE__ */ jsx("span", { className: `payment-mgmt-status tone-${tone}`, children: statusLabel(status) })
    ] }),
    loading ? /* @__PURE__ */ jsxs("div", { className: "payment-mgmt-loading", children: [
      /* @__PURE__ */ jsx(Loader2, { size: 15, className: "spin" }),
      " Loading payment details…"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      !effectivePaid && !squareOrderId ? /* @__PURE__ */ jsx("p", { className: "payment-mgmt-empty", children: "No payment has been authorized for this reservation. The customer did not pay at booking, or payment was not required." }) : needsConfig ? /* @__PURE__ */ jsxs("div", { className: "payment-mgmt-setup", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { size: 15 }),
        /* @__PURE__ */ jsxs("span", { children: [
          "Square is not fully configured. Payment status is shown from the reservation record, but charging is unavailable until ",
          /* @__PURE__ */ jsx("strong", { children: "SQUARE_APP_ID" }),
          " and",
          " ",
          /* @__PURE__ */ jsx("strong", { children: "SQUARE_ACCESS_TOKEN" }),
          " are added in secure configuration."
        ] })
      ] }) : null,
      (effectivePaid || squareOrderId) && /* @__PURE__ */ jsxs("dl", { className: "payment-mgmt-grid", children: [
        amountText && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { children: "Authorized amount" }),
          /* @__PURE__ */ jsx("dd", { children: amountText })
        ] }),
        !amountText && fareText && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { children: "Fare on file" }),
          /* @__PURE__ */ jsx("dd", { children: fareText })
        ] }),
        hasCard && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { children: "Card" }),
          /* @__PURE__ */ jsxs("dd", { children: [
            brandLabel(details?.cardBrand),
            details?.last4 ? ` •••• ${details.last4}` : ""
          ] })
        ] }),
        details?.paymentId && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { children: "Payment ID" }),
          /* @__PURE__ */ jsx("dd", { className: "payment-mgmt-mono", children: details.paymentId })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { children: "Capture state" }),
          /* @__PURE__ */ jsx("dd", { children: effectiveCaptured ? "Captured — funds collected after service" : "Authorized — hold placed, not yet charged" })
        ] })
      ] }),
      details?.lookupFailed && details.message && /* @__PURE__ */ jsx("p", { className: "payment-mgmt-note", children: details.message }),
      effectivePaid && squareOrderId && !effectiveCaptured && /* @__PURE__ */ jsxs("div", { className: "payment-mgmt-action", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "primary-button payment-mgmt-capture",
            disabled: capturing || needsConfig,
            onClick: () => void capturePayment(),
            children: [
              capturing ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "spin" }) : /* @__PURE__ */ jsx(HandCoins, { size: 16 }),
              " ",
              capturing ? "Capturing…" : "Capture authorized charge"
            ]
          }
        ),
        captureError && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", children: captureError }),
        captureDone && /* @__PURE__ */ jsx("span", { className: "saved-note", children: "Payment captured — funds collected." }),
        needsConfig && /* @__PURE__ */ jsx("p", { className: "payment-mgmt-note", children: "Charging is unavailable until Square credentials are configured." })
      ] }),
      effectiveCaptured && /* @__PURE__ */ jsxs("p", { className: "payment-mgmt-captured-note", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { size: 14 }),
        " This payment was captured. The authorized hold has been collected as the fare."
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "payment-mgmt-safe", children: [
        /* @__PURE__ */ jsx(Lock, { size: 12 }),
        " Card details are tokenized by Square. Full card numbers and security codes are never stored on this site."
      ] })
    ] })
  ] });
}
const isoToDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const isoToTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
function toForm(r) {
  const returnTrip = Boolean(r.returnAt);
  return {
    status: normalizeStatus(r.status),
    service: r.service === "hourly" ? "hourly" : "ride",
    pickup: r.pickup ?? "",
    dropoff: r.dropoff ?? "",
    extraStop: r.extraStop ?? "",
    pickupDate: isoToDate(r.pickupAt),
    pickupTime: isoToTime(r.pickupAt),
    returnTrip,
    returnDate: returnTrip ? isoToDate(r.returnAt) : "",
    returnTime: returnTrip ? isoToTime(r.returnAt) : "",
    hours: Number(r.hours) || 2,
    vehicle: ["sedan", "suv", "van"].includes(r.vehicle) ? r.vehicle : "sedan",
    passengers: Number(r.passengers) || 1,
    name: r.name ?? "",
    email: r.email ?? "",
    phone: r.phone ?? "",
    flight: r.flight ?? "",
    notes: r.notes ?? "",
    carSeat: !!r.carSeat,
    insidePickup: !!r.insidePickup,
    estimatedFareText: r.estimatedFareText ?? "",
    distanceMiles: r.distanceMiles != null ? String(r.distanceMiles) : "",
    paid: !!r.paid,
    captured: !!r.captured,
    driver: r.driver ?? ""
  };
}
function ReservationEditor({
  reservation,
  onClose,
  onSaved,
  onDeleted
}) {
  const [form, setForm] = useState(() => toForm(reservation));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const tierName = useVehicleTierName();
  useEffect(() => {
    pocketbaseClient.collection("drivers").getFullList({
      sort: "name",
      requestKey: null
    }).then((rows) => setDrivers(rows.filter((d) => d.active))).catch(() => {
    });
  }, []);
  useEffect(() => {
    setForm(toForm(reservation));
    setSaved(false);
    setError("");
    setConfirmDelete(false);
  }, [reservation.id]);
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && !saving && !deleting) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving, deleting]);
  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }
  function validate() {
    if (form.name.trim().length < 2) return "Enter the passenger’s full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address.";
    if (form.phone.replace(/\D/g, "").length < 7) return "Enter a valid phone number.";
    if (!form.pickup.trim()) return "Pickup address is required.";
    if (form.service === "ride" && !form.dropoff.trim()) return "Dropoff address is required for a point-to-point ride.";
    if (!form.pickupDate || !form.pickupTime) return "Pickup date and time are required.";
    if (form.returnTrip && (!form.returnDate || !form.returnTime)) return "Return date and time are required.";
    if (form.passengers < 1) return "Passengers must be at least 1.";
    return "";
  }
  async function save(e) {
    e.preventDefault();
    if (saving) return;
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    const payload = {
      status: form.status,
      service: form.service,
      pickup: form.pickup.trim(),
      dropoff: form.service === "ride" ? form.dropoff.trim() : "",
      extraStop: form.service === "ride" ? form.extraStop.trim() : "",
      pickupAt: dateTime(form.pickupDate, form.pickupTime).toISOString(),
      returnAt: form.returnTrip ? dateTime(form.returnDate, form.returnTime).toISOString() : "",
      pickupLocal: formatTripDate(form.pickupDate, form.pickupTime),
      returnLocal: form.returnTrip ? formatTripDate(form.returnDate, form.returnTime) : "",
      hours: form.service === "hourly" ? Number(form.hours) || 2 : 2,
      vehicle: form.vehicle,
      passengers: Number(form.passengers) || 1,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      flight: form.flight.trim(),
      notes: form.notes.trim(),
      carSeat: !!form.carSeat,
      insidePickup: !!form.insidePickup,
      estimatedFareText: form.estimatedFareText.trim(),
      distanceMiles: form.distanceMiles === "" ? null : Number(form.distanceMiles),
      paid: !!form.paid,
      driver: form.driver || null
    };
    try {
      const updated = await pocketbaseClient.collection("reservations").update(reservation.id, payload);
      setSaved(true);
      onSaved(updated);
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError("Couldn’t save changes. Please sign in again and retry.");
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (deleting) return;
    setDeleting(true);
    setError("");
    try {
      await pocketbaseClient.collection("reservations").delete(reservation.id);
      onDeleted(reservation.id);
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError("Couldn’t delete this reservation. Please try again.");
      setDeleting(false);
    }
  }
  const ref = `RB-${reservation.id.slice(-8).toUpperCase()}`;
  return /* @__PURE__ */ jsx("div", { className: "editor-scrim", role: "dialog", "aria-modal": "true", "aria-label": `Reservation ${ref}`, onClick: (e) => {
    if (e.target === e.currentTarget && !saving && !deleting) onClose();
  }, children: /* @__PURE__ */ jsxs("div", { className: "editor-panel", children: [
    /* @__PURE__ */ jsxs("div", { className: "editor-head", children: [
      /* @__PURE__ */ jsxs("div", { className: "editor-head-title", children: [
        /* @__PURE__ */ jsx("span", { className: "editor-ref", children: ref }),
        /* @__PURE__ */ jsx(StatusBadge, { value: form.status }),
        reservation.sourceName && /* @__PURE__ */ jsx("span", { className: "editor-source", children: reservation.sourceName })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "icon-button", onClick: onClose, "aria-label": "Close editor", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("form", { className: "editor-body", onSubmit: save, children: [
      /* @__PURE__ */ jsxs("fieldset", { className: "editor-fieldset", children: [
        /* @__PURE__ */ jsx("legend", { children: "Booking status" }),
        /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
          "Current status",
          /* @__PURE__ */ jsxs("div", { className: "status-select-wrap", children: [
            /* @__PURE__ */ jsx("span", { className: "status-dot status-dot-inline", style: { background: STATUS_META[form.status].dot }, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                className: "standard-input status-select",
                value: form.status,
                onChange: (e) => set("status", e.target.value),
                children: RESERVATION_STATUSES.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: STATUS_META[s].label }, s))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "editor-hint", children: STATUS_META[form.status].description })
      ] }),
      /* @__PURE__ */ jsxs("fieldset", { className: "editor-fieldset", children: [
        /* @__PURE__ */ jsx("legend", { children: "Trip" }),
        /* @__PURE__ */ jsx("div", { className: "service-tabs", children: ["ride", "hourly"].map((s) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: `service-tab${form.service === s ? " selected" : ""}`,
            onClick: () => set("service", s),
            children: SERVICE_LABELS[s]
          },
          s
        )) }),
        /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
          "Pickup",
          /* @__PURE__ */ jsx("input", { className: "standard-input", value: form.pickup, onChange: (e) => set("pickup", e.target.value), placeholder: "Pickup address" })
        ] }),
        form.service === "ride" && /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
          "Dropoff",
          /* @__PURE__ */ jsx("input", { className: "standard-input", value: form.dropoff, onChange: (e) => set("dropoff", e.target.value), placeholder: "Dropoff address" })
        ] }),
        form.service === "ride" && /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
          "Extra stop ",
          /* @__PURE__ */ jsx("span", { className: "optional", children: "optional" }),
          /* @__PURE__ */ jsx("input", { className: "standard-input", value: form.extraStop, onChange: (e) => set("extraStop", e.target.value), placeholder: "Additional stop along the way" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "editor-grid-two", children: [
          /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
            "Pickup date",
            /* @__PURE__ */ jsx("input", { className: "standard-input", type: "date", value: form.pickupDate, onChange: (e) => set("pickupDate", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
            "Pickup time",
            /* @__PURE__ */ jsx("input", { className: "standard-input", type: "time", value: form.pickupTime, onChange: (e) => set("pickupTime", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "toggle-row", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", className: "switch-input", checked: form.returnTrip, onChange: (e) => set("returnTrip", e.target.checked) }),
          /* @__PURE__ */ jsx("span", { className: "switch-track", "aria-hidden": "true" }),
          /* @__PURE__ */ jsx("span", { children: "Round trip (add a return)" })
        ] }),
        form.returnTrip && /* @__PURE__ */ jsxs("div", { className: "editor-grid-two", children: [
          /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
            "Return date",
            /* @__PURE__ */ jsx("input", { className: "standard-input", type: "date", value: form.returnDate, onChange: (e) => set("returnDate", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
            "Return time",
            /* @__PURE__ */ jsx("input", { className: "standard-input", type: "time", value: form.returnTime, onChange: (e) => set("returnTime", e.target.value) })
          ] })
        ] }),
        form.service === "hourly" && /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
          "Duration (hours)",
          /* @__PURE__ */ jsx("input", { className: "standard-input", type: "number", min: 2, max: 12, value: form.hours, onChange: (e) => set("hours", Number(e.target.value)) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
          "Vehicle",
          /* @__PURE__ */ jsx("select", { className: "standard-input", value: form.vehicle, onChange: (e) => set("vehicle", e.target.value), children: ["sedan", "suv", "van"].map((id) => /* @__PURE__ */ jsx("option", { value: id, children: tierName(id) }, id)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "passenger-control", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Passengers" }),
            /* @__PURE__ */ jsx("span", { children: "Seats to reserve" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "passenger-stepper", children: [
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => set("passengers", Math.max(1, form.passengers - 1)), disabled: form.passengers <= 1, children: "−" }),
            /* @__PURE__ */ jsx("strong", { children: form.passengers }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => set("passengers", Math.min(8, form.passengers + 1)), disabled: form.passengers >= 8, children: "+" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
          "Assigned driver ",
          /* @__PURE__ */ jsx("span", { className: "optional", children: "optional" }),
          /* @__PURE__ */ jsxs("select", { className: "standard-input", value: form.driver, onChange: (e) => set("driver", e.target.value), children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Unassigned" }),
            drivers.map((d) => /* @__PURE__ */ jsx("option", { value: d.id, children: d.name || d.email }, d.id))
          ] })
        ] }),
        reservation.driverStatus && /* @__PURE__ */ jsxs("div", { style: { margin: "6px 0 10px", padding: "6px 12px", background: "#eef4ff", borderRadius: 8, fontSize: 12, color: "var(--blue)", fontWeight: 700 }, children: [
          "Chauffeur status: ",
          reservation.driverStatus.replace("_", " ").toUpperCase()
        ] }),
        reservation.driverNotes && /* @__PURE__ */ jsxs("div", { style: { margin: "6px 0 10px", padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "var(--ink)" }, children: [
          /* @__PURE__ */ jsx("strong", { style: { display: "block", marginBottom: 2, color: "var(--ink)" }, children: "Chauffeur note:" }),
          reservation.driverNotes
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "editor-add-ons", children: [
          /* @__PURE__ */ jsxs("span", { className: "editor-add-ons-label", children: [
            "Optional add-ons ",
            /* @__PURE__ */ jsx("span", { className: "optional", children: "extra charge" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "toggle-row", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", className: "switch-input", checked: form.carSeat, onChange: (e) => set("carSeat", e.target.checked) }),
            /* @__PURE__ */ jsx("span", { className: "switch-track", "aria-hidden": "true" }),
            /* @__PURE__ */ jsx(Baby, { size: 16 }),
            /* @__PURE__ */ jsx("span", { children: "Car seat" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "toggle-row", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", className: "switch-input", checked: form.insidePickup, onChange: (e) => set("insidePickup", e.target.checked) }),
            /* @__PURE__ */ jsx("span", { className: "switch-track", "aria-hidden": "true" }),
            /* @__PURE__ */ jsx(DoorOpen, { size: 16 }),
            /* @__PURE__ */ jsx("span", { children: "Inside pickup" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("fieldset", { className: "editor-fieldset", children: [
        /* @__PURE__ */ jsx("legend", { children: "Passenger contact" }),
        /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
          "Full name",
          /* @__PURE__ */ jsx("input", { className: "standard-input", value: form.name, onChange: (e) => set("name", e.target.value), placeholder: "Passenger name" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "editor-grid-two", children: [
          /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
            "Email",
            /* @__PURE__ */ jsx("input", { className: "standard-input", type: "email", value: form.email, onChange: (e) => set("email", e.target.value), placeholder: "Email" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
            "Phone",
            /* @__PURE__ */ jsx("input", { className: "standard-input", value: form.phone, onChange: (e) => set("phone", e.target.value), placeholder: "Phone" }),
            form.phone.trim() && /* @__PURE__ */ jsxs("a", { className: "editor-call-link", href: `tel:${form.phone.replace(/[^\d+]/g, "")}`, children: [
              /* @__PURE__ */ jsx(Phone, { size: 13 }),
              " Call ",
              form.phone
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
          "Flight number ",
          /* @__PURE__ */ jsx("span", { className: "optional", children: "optional" }),
          /* @__PURE__ */ jsx("input", { className: "standard-input", value: form.flight, onChange: (e) => set("flight", e.target.value), placeholder: "e.g. UA 1234" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
          "Notes ",
          /* @__PURE__ */ jsx("span", { className: "optional", children: "optional" }),
          /* @__PURE__ */ jsx("textarea", { className: "standard-input", rows: 3, value: form.notes, onChange: (e) => set("notes", e.target.value), placeholder: "Special instructions, luggage, child seats…" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("fieldset", { className: "editor-fieldset", children: [
        /* @__PURE__ */ jsx("legend", { children: "Fare & payment" }),
        /* @__PURE__ */ jsxs("div", { className: "editor-grid-two", children: [
          /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
            "Fare (display)",
            /* @__PURE__ */ jsx("input", { className: "standard-input", value: form.estimatedFareText, onChange: (e) => set("estimatedFareText", e.target.value), placeholder: "e.g. $48.50" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "editor-label", children: [
            "Distance (mi)",
            /* @__PURE__ */ jsx("input", { className: "standard-input", type: "number", step: "0.1", min: 0, value: form.distanceMiles, onChange: (e) => set("distanceMiles", e.target.value), placeholder: "0.0" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "toggle-row", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", className: "switch-input", checked: form.paid, onChange: (e) => set("paid", e.target.checked) }),
          /* @__PURE__ */ jsx("span", { className: "switch-track", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Marked as paid",
            reservation.squareOrderId ? " · Square" : ""
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          PaymentManagement,
          {
            reservationId: reservation.id,
            squareOrderId: reservation.squareOrderId,
            paid: form.paid,
            captured: form.captured,
            fareText: form.estimatedFareText,
            onCaptured: () => {
              setForm((prev) => ({ ...prev, captured: true, paid: true }));
              onSaved({ ...reservation, captured: true, paid: true });
            }
          }
        )
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", children: error }),
      /* @__PURE__ */ jsxs("div", { className: "editor-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "submit", className: "primary-button", disabled: saving, children: saving ? "Saving…" : /* @__PURE__ */ jsxs(Fragment, { children: [
          saved ? /* @__PURE__ */ jsx(Check, { size: 17 }) : /* @__PURE__ */ jsx(Save, { size: 17 }),
          " ",
          saved ? "Saved" : "Save changes"
        ] }) }),
        saved && /* @__PURE__ */ jsx("span", { className: "saved-note", children: "Reservation updated." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "editor-delete-zone", children: confirmDelete ? /* @__PURE__ */ jsxs("div", { className: "confirm-delete", children: [
        /* @__PURE__ */ jsx("span", { children: "Delete this reservation permanently?" }),
        /* @__PURE__ */ jsxs("div", { className: "confirm-delete-actions", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "ghost-button", onClick: () => setConfirmDelete(false), disabled: deleting, children: "Keep it" }),
          /* @__PURE__ */ jsxs("button", { type: "button", className: "danger-button", onClick: remove, disabled: deleting, children: [
            deleting ? /* @__PURE__ */ jsx(Loader2, { size: 15 }) : /* @__PURE__ */ jsx(Trash2, { size: 15 }),
            " Delete"
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxs("button", { type: "button", className: "delete-link", onClick: () => setConfirmDelete(true), children: [
        /* @__PURE__ */ jsx(Trash2, { size: 14 }),
        " Delete reservation"
      ] }) })
    ] })
  ] }) });
}
const emptyForm = {
  ...DEFAULT_PRICING,
  businessName: "",
  dispatchEmail: "",
  dispatchName: "Dispatch",
  customerEmailEnabled: true
};
function authHeaders$2() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${pocketbaseClient.authStore.token}`
  };
}
function PricingPanel({
  businessId,
  businessLabel,
  onSaved
}) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  function applyRecord(first) {
    setForm({
      baseRate: first.baseRate,
      minimumFare: first.minimumFare,
      perMileRate: first.perMileRate,
      hourlyRate: first.hourlyRate,
      currency: first.currency,
      tipEnabled: !!first.tipEnabled,
      tipPercent: first.tipPercent ?? DEFAULT_PRICING.tipPercent,
      taxEnabled: !!first.taxEnabled,
      taxPercent: first.taxPercent ?? DEFAULT_PRICING.taxPercent,
      tollsEnabled: !!first.tollsEnabled,
      fareVisible: !!first.fareVisible,
      paymentRequired: first.paymentRequired !== false,
      carSeatPrice: first.carSeatPrice ?? DEFAULT_PRICING.carSeatPrice,
      extraStopPrice: first.extraStopPrice ?? DEFAULT_PRICING.extraStopPrice,
      insidePickupPrice: first.insidePickupPrice ?? DEFAULT_PRICING.insidePickupPrice,
      minAdvanceHours: first.minAdvanceHours ?? DEFAULT_PRICING.minAdvanceHours,
      businessName: first.businessName ?? "",
      dispatchEmail: first.dispatchEmail ?? "",
      dispatchName: first.dispatchName ?? "Dispatch",
      customerEmailEnabled: !!first.customerEmailEnabled
    });
  }
  useEffect(() => {
    let active = true;
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    fetch("/api/business-settings", {
      method: "POST",
      headers: authHeaders$2(),
      body: JSON.stringify({ op: "load", biz: businessId })
    }).then(async (res) => {
      const data2 = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data2.error || "Failed to load settings.");
        err.status = res.status;
        throw err;
      }
      return data2.settings;
    }).then((s) => {
      if (!active) return;
      applyRecord(s);
    }).catch((err) => {
      if (handlePbAuthError(err)) return;
      if (active) setLoadError(err instanceof Error ? err.message : "Couldn’t load your saved rates — showing defaults below.");
    }).finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [businessId]);
  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }
  async function save(e) {
    e.preventDefault();
    if (saving || !businessId) return;
    setSaving(true);
    setError("");
    setSaved(false);
    const payload = {
      baseRate: Number(form.baseRate) || 0,
      minimumFare: Number(form.minimumFare) || 0,
      perMileRate: Number(form.perMileRate) || 0,
      hourlyRate: Number(form.hourlyRate) || 0,
      currency: form.currency.trim().toUpperCase() || "USD",
      tipEnabled: !!form.tipEnabled,
      tipPercent: Number(form.tipPercent) || 0,
      taxEnabled: !!form.taxEnabled,
      taxPercent: Number(form.taxPercent) || 0,
      tollsEnabled: !!form.tollsEnabled,
      fareVisible: !!form.fareVisible,
      paymentRequired: form.paymentRequired !== false,
      carSeatPrice: Number(form.carSeatPrice) || 0,
      extraStopPrice: Number(form.extraStopPrice) || 0,
      insidePickupPrice: Number(form.insidePickupPrice) || 0,
      minAdvanceHours: Math.min(24, Math.max(1, Math.round(Number(form.minAdvanceHours) || DEFAULT_PRICING.minAdvanceHours))),
      businessName: form.businessName.trim(),
      dispatchEmail: form.dispatchEmail.trim(),
      dispatchName: form.dispatchName.trim(),
      customerEmailEnabled: !!form.customerEmailEnabled
    };
    try {
      const res = await fetch("/api/business-settings", {
        method: "POST",
        headers: authHeaders$2(),
        body: JSON.stringify({ op: "save", biz: businessId, settings: payload })
      });
      const data2 = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data2.error || "Couldn’t save settings.");
        err.status = res.status;
        throw err;
      }
      applyRecord(data2.settings);
      setSaved(true);
      setLoadError("");
      onSaved?.(data2.settings.businessName ?? payload.businessName);
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError(err instanceof Error ? err.message : "Couldn’t save settings. Please sign in again and retry.");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsxs("form", { className: "dash-card pricing-panel", onSubmit: save, children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-card-head", children: [
      /* @__PURE__ */ jsx("span", { className: "dash-card-icon", children: /* @__PURE__ */ jsx(Settings2, { size: 18 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { children: [
          "Business settings",
          businessLabel ? /* @__PURE__ */ jsxs("span", { className: "dash-card-business", children: [
            " · ",
            businessLabel
          ] }) : null
        ] }),
        /* @__PURE__ */ jsx("p", { children: "Set tips, taxes, tolls, booking options, and notifications. Vehicle rates stay in Vehicle categories." })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsxs("div", { className: "dash-loading", children: [
      /* @__PURE__ */ jsx(Loader2, { size: 20 }),
      " Loading settings…"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      loadError && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", style: { background: "#fdeeee", border: "1px solid #f3d2d4", color: "#b5333b", padding: "10px 12px", borderRadius: 9, marginBottom: 16 }, children: loadError }),
      /* @__PURE__ */ jsxs("div", { className: "dispatch-section compact pricing-panel-first", children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          /* @__PURE__ */ jsx(Eye, { size: 15 }),
          " Booking options"
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "toggle-row", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.fareVisible, onChange: (e) => set("fareVisible", e.target.checked), className: "switch-input" }),
          /* @__PURE__ */ jsx("span", { className: "switch-track", "aria-hidden": "true" }),
          /* @__PURE__ */ jsx("span", { children: "Show estimated prices to customers" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "toggle-row", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.paymentRequired, onChange: (e) => set("paymentRequired", e.target.checked), className: "switch-input" }),
          /* @__PURE__ */ jsx("span", { className: "switch-track", "aria-hidden": "true" }),
          /* @__PURE__ */ jsx("span", { children: "Require online payment to book" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "dispatch-hint", children: form.paymentRequired ? "Customers pay through Square checkout before confirmation." : "Checkout is skipped — customers confirm on the booking page with no charge." }),
        /* @__PURE__ */ jsxs("div", { className: "advance-notice-row", children: [
          /* @__PURE__ */ jsxs("label", { className: "advance-notice-label", htmlFor: "advance-hours", children: [
            /* @__PURE__ */ jsx(Clock3, { size: 14 }),
            " Minimum advance notice"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "advance-notice-control", children: [
            /* @__PURE__ */ jsx("select", { id: "advance-hours", className: "advance-notice-select", value: form.minAdvanceHours, onChange: (e) => set("minAdvanceHours", Number(e.target.value)), children: Array.from({ length: 24 }, (_, i) => i + 1).map((h) => /* @__PURE__ */ jsxs("option", { value: h, children: [
              h,
              " hour",
              h === 1 ? "" : "s"
            ] }, h)) }),
            /* @__PURE__ */ jsx("span", { className: "advance-notice-hint", children: "before pickup" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dispatch-section compact", children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          /* @__PURE__ */ jsx(Percent, { size: 15 }),
          " Tips, taxes & tolls"
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "toggle-row toggle-row-inline", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.tipEnabled, onChange: (e) => set("tipEnabled", e.target.checked), className: "switch-input" }),
          /* @__PURE__ */ jsx("span", { className: "switch-track", "aria-hidden": "true" }),
          /* @__PURE__ */ jsx("span", { children: "Add a gratuity (tip)" }),
          form.tipEnabled && /* @__PURE__ */ jsxs("span", { className: "inline-percent", children: [
            /* @__PURE__ */ jsx("input", { type: "number", step: "0.1", min: "0", max: "100", value: form.tipPercent, onChange: (e) => set("tipPercent", Number(e.target.value)), "aria-label": "Tip percentage" }),
            /* @__PURE__ */ jsx("em", { children: "% of fare" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "toggle-row toggle-row-inline", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.taxEnabled, onChange: (e) => set("taxEnabled", e.target.checked), className: "switch-input" }),
          /* @__PURE__ */ jsx("span", { className: "switch-track", "aria-hidden": "true" }),
          /* @__PURE__ */ jsx("span", { children: "Add tax" }),
          form.taxEnabled && /* @__PURE__ */ jsxs("span", { className: "inline-percent", children: [
            /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", min: "0", max: "100", value: form.taxPercent, onChange: (e) => set("taxPercent", Number(e.target.value)), "aria-label": "Tax percentage" }),
            /* @__PURE__ */ jsx("em", { children: "% of fare + tolls" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "toggle-row", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.tollsEnabled, onChange: (e) => set("tollsEnabled", e.target.checked), className: "switch-input" }),
          /* @__PURE__ */ jsx("span", { className: "switch-track", "aria-hidden": "true" }),
          /* @__PURE__ */ jsx("span", { children: "Include estimated tolls in the total" })
        ] }),
        form.tollsEnabled && /* @__PURE__ */ jsx("p", { className: "dispatch-hint", children: "Estimated from the driving route when a maps key is set." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dispatch-section compact", children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          /* @__PURE__ */ jsx(CircleDollarSign, { size: 15 }),
          " Optional add-on prices"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "dispatch-hint", children: "Set a flat price for each optional add-on. Customers see the cost when they select it, and it is added to their total." }),
        /* @__PURE__ */ jsxs("div", { className: "addon-price-grid", children: [
          /* @__PURE__ */ jsxs("label", { className: "rate-field", children: [
            /* @__PURE__ */ jsx("span", { children: "Car seat" }),
            /* @__PURE__ */ jsxs("div", { className: "rate-input", children: [
              /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", min: "0", value: form.carSeatPrice, onChange: (e) => set("carSeatPrice", Number(e.target.value)) }),
              /* @__PURE__ */ jsx("em", { children: "flat" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "rate-field", children: [
            /* @__PURE__ */ jsx("span", { children: "Extra stop" }),
            /* @__PURE__ */ jsxs("div", { className: "rate-input", children: [
              /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", min: "0", value: form.extraStopPrice, onChange: (e) => set("extraStopPrice", Number(e.target.value)) }),
              /* @__PURE__ */ jsx("em", { children: "flat" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "rate-field", children: [
            /* @__PURE__ */ jsx("span", { children: "Inside pickup" }),
            /* @__PURE__ */ jsxs("div", { className: "rate-input", children: [
              /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", min: "0", value: form.insidePickupPrice, onChange: (e) => set("insidePickupPrice", Number(e.target.value)) }),
              /* @__PURE__ */ jsx("em", { children: "flat" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dispatch-section compact", children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          /* @__PURE__ */ jsx(Mail, { size: 15 }),
          " Reservation notifications"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "editor-grid-two", children: [
          /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
            "Dispatch / driver email",
            /* @__PURE__ */ jsx("input", { className: "standard-input", type: "email", placeholder: "dispatch@yourcompany.com", value: form.dispatchEmail, onChange: (e) => set("dispatchEmail", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "input-label", children: [
            "Sender display name",
            /* @__PURE__ */ jsx("input", { className: "standard-input", type: "text", placeholder: "Your business dispatch", value: form.dispatchName, onChange: (e) => set("dispatchName", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "toggle-row", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.customerEmailEnabled, onChange: (e) => set("customerEmailEnabled", e.target.checked), className: "switch-input" }),
          /* @__PURE__ */ jsx("span", { className: "switch-track", "aria-hidden": "true" }),
          /* @__PURE__ */ jsx("span", { children: "Also email a confirmation to the customer" })
        ] }),
        !form.dispatchEmail && /* @__PURE__ */ jsx("p", { className: "dispatch-hint", children: "No dispatch email set — reservation emails won’t be sent until you add one above." })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", children: error }),
      /* @__PURE__ */ jsxs("div", { className: "dash-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "submit", className: "primary-button", disabled: saving, children: saving ? "Saving…" : /* @__PURE__ */ jsxs(Fragment, { children: [
          saved ? /* @__PURE__ */ jsx(Check, { size: 17 }) : /* @__PURE__ */ jsx(Save, { size: 17 }),
          " ",
          saved ? "Saved" : "Save changes"
        ] }) }),
        saved && /* @__PURE__ */ jsx("span", { className: "saved-note", children: "Saved — customers see these rates on their next booking." })
      ] })
    ] })
  ] });
}
function authHeaders$1() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${pocketbaseClient.authStore.token}`
  };
}
function authHeaderOnly() {
  return { Authorization: `Bearer ${pocketbaseClient.authStore.token}` };
}
function VehicleTiersPanel({
  businessId,
  businessLabel
}) {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [uploadingId, setUploadingId] = useState("");
  const fileRefs = useRef({});
  useEffect(() => {
    let active = true;
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    fetch("/api/business-tiers", {
      method: "POST",
      headers: authHeaders$1(),
      body: JSON.stringify({ op: "load", biz: businessId })
    }).then(async (res) => {
      const data2 = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data2.error || "Failed to load vehicle categories.");
        err.status = res.status;
        throw err;
      }
      return data2.tiers;
    }).then((rows) => {
      if (!active) return;
      setTiers(rows);
    }).catch((err) => {
      if (handlePbAuthError(err)) return;
      if (active) {
        setTiers([]);
        setLoadError(err instanceof Error ? err.message : "Couldn’t load your vehicle categories — please sign in again and retry.");
      }
    }).finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [businessId]);
  function update(id, patch) {
    setTiers((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t));
    setSaved(false);
  }
  async function uploadPhoto(id, file) {
    if (!businessId || !id || uploadingId) return;
    setUploadingId(id);
    setError("");
    try {
      const fd = new FormData();
      fd.append("op", "upload-photo");
      fd.append("biz", businessId);
      fd.append("tierId", id);
      fd.append("photo", file);
      const res = await fetch("/api/business-tiers", { method: "POST", headers: authHeaderOnly(), body: fd });
      const data2 = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data2.error || "Couldn’t upload photo.");
        err.status = res.status;
        throw err;
      }
      setTiers((prev) => prev.map((t) => t.id === id ? { ...t, photo: data2.photo } : t));
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError(err instanceof Error ? err.message : "Couldn’t upload photo. Please try again.");
    } finally {
      setUploadingId("");
    }
  }
  async function removePhoto(id) {
    if (!businessId || !id || uploadingId) return;
    setUploadingId(id);
    setError("");
    try {
      const res = await fetch("/api/business-tiers", {
        method: "POST",
        headers: authHeaders$1(),
        body: JSON.stringify({ op: "remove-photo", biz: businessId, tierId: id })
      });
      const data2 = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data2.error || "Couldn’t remove photo.");
        err.status = res.status;
        throw err;
      }
      setTiers((prev) => prev.map((t) => t.id === id ? { ...t, photo: "" } : t));
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError(err instanceof Error ? err.message : "Couldn’t remove photo. Please try again.");
    } finally {
      setUploadingId("");
    }
  }
  async function save(e) {
    e.preventDefault();
    if (saving || !businessId) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/business-tiers", {
        method: "POST",
        headers: authHeaders$1(),
        body: JSON.stringify({
          op: "save",
          biz: businessId,
          tiers: tiers.map((t, i) => ({
            id: t.id,
            key: t.key,
            name: t.name.trim() || t.key,
            detail: t.detail.trim(),
            capacity: Number(t.capacity) || 3,
            minFare: Number(t.minFare) || 0,
            multiplier: Number(t.multiplier) || 1,
            perMileRate: Number(t.perMileRate) || 0,
            active: !!t.active,
            sort: i + 1
          }))
        })
      });
      const data2 = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data2.error || "Couldn’t save vehicle categories.");
        err.status = res.status;
        throw err;
      }
      setTiers(data2.tiers);
      setSaved(true);
      setLoadError("");
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError(err instanceof Error ? err.message : "Couldn’t save vehicle categories. Please sign in again and retry.");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsxs("form", { className: "dash-card vehicle-tiers-panel", onSubmit: save, children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-card-head", children: [
      /* @__PURE__ */ jsx("span", { className: "dash-card-icon", children: /* @__PURE__ */ jsx(CarFront, { size: 18 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { children: [
          "Vehicle categories",
          businessLabel ? /* @__PURE__ */ jsxs("span", { className: "dash-card-business", children: [
            " · ",
            businessLabel
          ] }) : null
        ] }),
        /* @__PURE__ */ jsx("p", { children: "Each vehicle category groups its details and applicable pricing together — edit the name, capacity, base rate, per-mile rate, and hourly multiplier per tier." })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsxs("div", { className: "dash-loading", children: [
      /* @__PURE__ */ jsx(Loader2, { size: 20 }),
      " Loading vehicle categories…"
    ] }) : tiers.length === 0 ? /* @__PURE__ */ jsx("div", { className: "dash-loading", children: "No vehicle categories found." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      loadError && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", style: { background: "#fdeeee", border: "1px solid #f3d2d4", color: "#b5333b", padding: "10px 12px", borderRadius: 9, marginBottom: 16 }, children: loadError }),
      /* @__PURE__ */ jsx("div", { className: "tiers-list", children: tiers.map((t) => /* @__PURE__ */ jsxs("div", { className: "tier-row", children: [
        /* @__PURE__ */ jsxs("div", { className: "tier-head", children: [
          /* @__PURE__ */ jsx("span", { className: "tier-key", children: t.key === "van" ? "Suv" : t.key }),
          /* @__PURE__ */ jsxs("label", { className: "toggle-row", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                className: "switch-input",
                checked: t.active,
                onChange: (e) => update(t.id, { active: e.target.checked })
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "switch-track", "aria-hidden": "true" }),
            /* @__PURE__ */ jsx("span", { children: t.active ? "Active on booking page" : "Hidden from booking page" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "tier-subgroup", children: [
          /* @__PURE__ */ jsx("span", { className: "tier-subgroup-label", children: "Category" }),
          /* @__PURE__ */ jsxs("div", { className: "tier-category-grid", children: [
            /* @__PURE__ */ jsxs("label", { className: "rate-field", children: [
              /* @__PURE__ */ jsx("span", { children: "Display name" }),
              /* @__PURE__ */ jsx("div", { className: "rate-input", children: /* @__PURE__ */ jsx("input", { type: "text", value: t.name, onChange: (e) => update(t.id, { name: e.target.value }) }) })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "rate-field", children: [
              /* @__PURE__ */ jsx("span", { children: "Capacity" }),
              /* @__PURE__ */ jsxs("div", { className: "rate-input", children: [
                /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 20, value: t.capacity, onChange: (e) => update(t.id, { capacity: Number(e.target.value) }) }),
                /* @__PURE__ */ jsx("em", { children: "pax" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "rate-field tier-desc", children: [
            /* @__PURE__ */ jsx("span", { children: "Description" }),
            /* @__PURE__ */ jsx("input", { className: "standard-input", type: "text", value: t.detail, onChange: (e) => update(t.id, { detail: e.target.value }), placeholder: "Short description shown on the booking page" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "tier-subgroup tier-pricing", children: [
          /* @__PURE__ */ jsx("span", { className: "tier-subgroup-label", children: "Pricing" }),
          /* @__PURE__ */ jsxs("div", { className: "tier-pricing-grid", children: [
            /* @__PURE__ */ jsxs("label", { className: "rate-field", children: [
              /* @__PURE__ */ jsx("span", { children: "Base rate" }),
              /* @__PURE__ */ jsxs("div", { className: "rate-input", children: [
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", min: "0", value: t.minFare, onChange: (e) => update(t.id, { minFare: Number(e.target.value) }) }),
                /* @__PURE__ */ jsx("em", { children: "base" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "rate-field", children: [
              /* @__PURE__ */ jsx("span", { children: "Per-mile rate" }),
              /* @__PURE__ */ jsxs("div", { className: "rate-input", children: [
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", min: "0", value: t.perMileRate, onChange: (e) => update(t.id, { perMileRate: Number(e.target.value) }) }),
                /* @__PURE__ */ jsx("em", { children: "/ mi" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "rate-field", children: [
              /* @__PURE__ */ jsx("span", { children: "Hourly multiplier" }),
              /* @__PURE__ */ jsxs("div", { className: "rate-input", children: [
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.05", min: "0", value: t.multiplier, onChange: (e) => update(t.id, { multiplier: Number(e.target.value) }) }),
                /* @__PURE__ */ jsx("em", { children: "×" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "tier-subgroup tier-photo", children: [
          /* @__PURE__ */ jsx("span", { className: "tier-subgroup-label", children: "Vehicle photo" }),
          /* @__PURE__ */ jsx("p", { className: "tier-photo-hint", children: "Shown to customers on the vehicle selection step so they can see the actual car. Upload a clear side or three-quarter view." }),
          /* @__PURE__ */ jsxs("div", { className: "tier-photo-row", children: [
            /* @__PURE__ */ jsxs("div", { className: "tier-photo-preview", children: [
              t.photo ? /* @__PURE__ */ jsx("img", { src: t.photo, alt: t.name || t.key }) : /* @__PURE__ */ jsx("span", { className: "tier-photo-placeholder", children: /* @__PURE__ */ jsx(CarFront, { size: 26, strokeWidth: 1.5 }) }),
              uploadingId === t.id && /* @__PURE__ */ jsx("span", { className: "tier-photo-loading", children: /* @__PURE__ */ jsx(Loader2, { size: 18 }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "tier-photo-actions", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  ref: (el) => {
                    fileRefs.current[t.id] = el;
                  },
                  type: "file",
                  accept: "image/jpeg,image/png,image/webp,image/gif",
                  className: "tier-photo-input",
                  onChange: (e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(t.id, file);
                    e.target.value = "";
                  }
                }
              ),
              /* @__PURE__ */ jsxs("button", { type: "button", className: "tier-photo-button", onClick: () => fileRefs.current[t.id]?.click(), disabled: !!uploadingId, children: [
                /* @__PURE__ */ jsx(ImageUp, { size: 15 }),
                " ",
                t.photo ? "Replace photo" : "Upload photo"
              ] }),
              t.photo && /* @__PURE__ */ jsxs("button", { type: "button", className: "tier-photo-remove", onClick: () => removePhoto(t.id), disabled: !!uploadingId, children: [
                /* @__PURE__ */ jsx(Trash2, { size: 15 }),
                " Remove"
              ] })
            ] })
          ] })
        ] })
      ] }, t.id || t.key)) }),
      error && /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", children: error }),
      /* @__PURE__ */ jsxs("div", { className: "dash-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "submit", className: "primary-button", disabled: saving, children: saving ? "Saving…" : /* @__PURE__ */ jsxs(Fragment, { children: [
          saved ? /* @__PURE__ */ jsx(Check, { size: 17 }) : /* @__PURE__ */ jsx(Save, { size: 17 }),
          " ",
          saved ? "Saved" : "Save vehicle categories"
        ] }) }),
        saved && /* @__PURE__ */ jsx("span", { className: "saved-note", children: "Saved — customers see these categories on their next booking." })
      ] })
    ] })
  ] });
}
function MapsStatusCard() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    let active = true;
    fetch("/api/pricing", { headers: { Accept: "application/json" } }).then((res) => res.json()).then((data2) => active && setStatus(data2)).catch(() => active && setStatus({ mapsConfigured: false, hasSettings: false }));
    return () => {
      active = false;
    };
  }, []);
  const configured = status?.mapsConfigured;
  return /* @__PURE__ */ jsxs("div", { className: `dash-card maps-card ${configured ? "ok" : "setup"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-card-head", children: [
      /* @__PURE__ */ jsx("span", { className: "dash-card-icon", children: configured ? /* @__PURE__ */ jsx(CheckCircle2, { size: 18 }) : /* @__PURE__ */ jsx(KeyRound, { size: 18 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { children: "Mapping & live distance" }),
        /* @__PURE__ */ jsx("p", { children: "Google Maps integration status" })
      ] })
    ] }),
    configured ? /* @__PURE__ */ jsxs("div", { className: "maps-state", children: [
      /* @__PURE__ */ jsxs("div", { className: "maps-state-row", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { size: 16 }),
        " ",
        /* @__PURE__ */ jsx("span", { children: "Google Maps API key detected" })
      ] }),
      /* @__PURE__ */ jsxs("ul", { className: "maps-features", children: [
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx(MapPin, { size: 14 }),
          " Real-time address autocomplete"
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx(Plane, { size: 14 }),
          " Airport-code & location validation"
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("span", { className: "dot" }),
          " Driving distance & live fare estimates"
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "maps-state", children: [
      /* @__PURE__ */ jsxs("div", { className: "maps-state-row warn", children: [
        /* @__PURE__ */ jsx(TriangleAlert, { size: 16 }),
        " ",
        /* @__PURE__ */ jsx("span", { children: "Running in fallback mode" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "maps-desc", children: "No Google Maps API key is set. Airport codes (JFK, LAX, ORD…) still validate and resolve, but live address autocomplete and driving-distance fares are unavailable until you add a key." }),
      /* @__PURE__ */ jsxs("ol", { className: "maps-steps", children: [
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Open" }),
          " the Google Cloud Console → APIs & Services → Credentials."
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Enable" }),
          " the Places API and Distance Matrix API."
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Create" }),
          " an API key and restrict it to your domain."
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Paste" }),
          " the key as ",
          /* @__PURE__ */ jsx("code", { children: "GOOGLE_MAPS_API_KEY" }),
          " in ",
          /* @__PURE__ */ jsx("code", { children: "apps/web/.env" }),
          ", then reload the app."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "maps-features", children: [
        /* @__PURE__ */ jsxs("span", { className: "badge-ok", children: [
          /* @__PURE__ */ jsx(Plane, { size: 13 }),
          " Airport codes work now"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "badge-off", children: [
          /* @__PURE__ */ jsx(MapPin, { size: 13 }),
          " Live addresses need a key"
        ] })
      ] })
    ] })
  ] });
}
function PaymentStatusCard() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    let active = true;
    fetch("/api/payment-status", { headers: { Accept: "application/json" } }).then((res) => res.json()).then((data2) => active && setStatus(data2)).catch(() => active && setStatus({ paymentsLive: false, needsConfiguration: true }));
    return () => {
      active = false;
    };
  }, []);
  const live = !!status?.paymentsLive;
  const configured = !!status?.squareConfigured;
  return /* @__PURE__ */ jsxs("div", { className: `dash-card maps-card ${live ? "ok" : "setup"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-card-head", children: [
      /* @__PURE__ */ jsx("span", { className: "dash-card-icon", children: live ? /* @__PURE__ */ jsx(CheckCircle2, { size: 18 }) : /* @__PURE__ */ jsx(KeyRound, { size: 18 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { children: "Card payments" }),
        /* @__PURE__ */ jsx("p", { children: "Live payment processing status" })
      ] })
    ] }),
    live ? /* @__PURE__ */ jsxs("div", { className: "maps-state", children: [
      /* @__PURE__ */ jsxs("div", { className: "maps-state-row", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { size: 16 }),
        " ",
        /* @__PURE__ */ jsx("span", { children: "Live — Square connected, card authorization at booking" })
      ] }),
      /* @__PURE__ */ jsxs("ul", { className: "maps-features", children: [
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx(CreditCard, { size: 14 }),
          " Card authorized (hold placed) through Square at booking"
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("span", { className: "dot" }),
          " Customer enters card in Square's secure form"
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("span", { className: "dot" }),
          " Operator captures the hold after the service is completed"
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "maps-state", children: [
      /* @__PURE__ */ jsxs("div", { className: "maps-state-row warn", children: [
        /* @__PURE__ */ jsx(TriangleAlert, { size: 16 }),
        " ",
        /* @__PURE__ */ jsx("span", { children: configured ? "Square credentials set — verify your account" : "Not connected — request-only mode" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "maps-desc", children: configured ? "Square credentials are present, but the configured location couldn’t be verified on your Square account. Reservations are submitted as requests and no card is authorized until the connection is confirmed." : "No live payment provider is connected. Reservations are submitted as requests and no card is authorized. Add your Square credentials to authorize a card hold at booking and capture it after the service." }),
      /* @__PURE__ */ jsxs("ol", { className: "maps-steps", children: [
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Open" }),
          " the Square Developer Dashboard and create an application."
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Copy" }),
          " your Square Application ID, Access Token, and Location ID."
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Add" }),
          " them to ",
          /* @__PURE__ */ jsx("code", { children: "apps/web/.env" }),
          " as ",
          /* @__PURE__ */ jsx("code", { children: "SQUARE_APP_ID" }),
          ", ",
          /* @__PURE__ */ jsx("code", { children: "SQUARE_ACCESS_TOKEN" }),
          ", and ",
          /* @__PURE__ */ jsx("code", { children: "SQUARE_LOCATION_ID" }),
          "."
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "(Optional)" }),
          " register ",
          /* @__PURE__ */ jsx("code", { children: "/api/square-webhook" }),
          " and set ",
          /* @__PURE__ */ jsx("code", { children: "SQUARE_WEBHOOK_SIGNATURE_KEY" }),
          "."
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Reload" }),
          " the dashboard. This card will show “Live — Square connected” and bookings will authorize a hold on the customer’s card. You capture the hold from a reservation after the ride is completed."
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "maps-features", children: /* @__PURE__ */ jsxs("span", { className: "badge-off", children: [
        /* @__PURE__ */ jsx(CreditCard, { size: 13 }),
        " ",
        configured ? "Square credentials set — verify account" : "Square connection needed"
      ] }) })
    ] })
  ] });
}
function BookingLinkCard({ businessId }) {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setLink(businessId ? `${window.location.origin}/?biz=${businessId}` : "");
    setCopied(false);
  }, [businessId]);
  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2e3);
    } catch {
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "dash-card booking-link-card", children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-card-head", children: [
      /* @__PURE__ */ jsx("span", { className: "dash-card-icon", children: /* @__PURE__ */ jsx(Link2, { size: 18 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { children: "Your booking page" }),
        /* @__PURE__ */ jsx("p", { children: "Share this link — requests come only to you" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "booking-link-row", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "standard-input booking-link-input",
          readOnly: true,
          value: link || "Loading…",
          onFocus: (e) => e.currentTarget.select(),
          "aria-label": "Your booking page link"
        }
      ),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "primary-button booking-link-copy", onClick: copy, children: [
        copied ? /* @__PURE__ */ jsx(Check, { size: 16 }) : /* @__PURE__ */ jsx(Copy, { size: 16 }),
        " ",
        copied ? "Copied" : "Copy link"
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "booking-link-hint", children: "Customers who open this link book with your rates and vehicle categories, and their reservations appear only in your dashboard and dispatch center." })
  ] });
}
const STATUS_DOT = { active: "#239476", inactive: "#8a94a5" };
function DriversPanel() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      let records;
      try {
        records = await pocketbaseClient.collection("drivers").getFullList({
          sort: "-created",
          requestKey: null
        });
      } catch {
        records = await pocketbaseClient.collection("drivers").getFullList({
          sort: "name",
          requestKey: null
        });
      }
      setDrivers(records);
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError("Couldn’t load drivers. Please sign in again.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function toggleActive(d) {
    setBusyId(d.id);
    try {
      const updated = await pocketbaseClient.collection("drivers").update(d.id, { active: !d.active });
      setDrivers((prev) => prev.map((x) => x.id === d.id ? updated : x));
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError("Couldn’t update that driver. Please try again.");
    } finally {
      setBusyId(null);
    }
  }
  async function changeVehicle(d, vehicle) {
    setBusyId(d.id);
    try {
      const updated = await pocketbaseClient.collection("drivers").update(d.id, { vehicle });
      setDrivers((prev) => prev.map((x) => x.id === d.id ? updated : x));
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError("Couldn’t update that driver. Please try again.");
    } finally {
      setBusyId(null);
    }
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await pocketbaseClient.collection("drivers").delete(deleteTarget.id);
      setDrivers((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setDeleteError("Couldn’t delete that driver. Please try again.");
    } finally {
      setDeleting(false);
    }
  }
  const activeCount = drivers.filter((d) => d.active).length;
  return /* @__PURE__ */ jsxs("div", { className: "dash-card drivers-panel", children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-card-head", children: [
      /* @__PURE__ */ jsx("span", { className: "dash-card-icon", children: /* @__PURE__ */ jsx(Users, { size: 18 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { children: "Drivers" }),
        /* @__PURE__ */ jsxs("p", { children: [
          drivers.length,
          " driver",
          drivers.length === 1 ? "" : "s",
          " · ",
          activeCount,
          " active"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "maps-desc", children: [
      "Drivers create their own accounts and passwords from the driver sign-up page (",
      /* @__PURE__ */ jsx("a", { className: "dashboard-link", href: "/driver/register", target: "_blank", rel: "noreferrer", children: "/driver/register" }),
      "). Once a driver exists, assign trips to them from any reservation’s editor. You can set a driver’s preferred vehicle, activate or deactivate them, or remove an account — but you never set or reset a driver’s password."
    ] }),
    loading ? /* @__PURE__ */ jsxs("div", { className: "dash-loading", children: [
      /* @__PURE__ */ jsx(Loader2, { size: 20 }),
      " Loading drivers…"
    ] }) : error ? /* @__PURE__ */ jsx("p", { className: "form-error", role: "alert", children: error }) : drivers.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "reservations-empty", children: [
      /* @__PURE__ */ jsx(Users, { size: 26 }),
      /* @__PURE__ */ jsx("p", { children: "No drivers yet. Share the driver sign-up link so drivers can create their own accounts." })
    ] }) : /* @__PURE__ */ jsx("div", { className: "drivers-list", children: drivers.map((d) => /* @__PURE__ */ jsxs("div", { className: `driver-row${d.active ? "" : " inactive"}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "driver-row-main", children: [
        /* @__PURE__ */ jsx("strong", { children: d.name || "Unnamed driver" }),
        /* @__PURE__ */ jsx("span", { className: "driver-row-email", children: d.email }),
        /* @__PURE__ */ jsxs("div", { className: "driver-row-meta", children: [
          d.phone && /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx(Phone, { size: 13 }),
            " ",
            d.phone
          ] }),
          /* @__PURE__ */ jsx(
            "select",
            {
              className: "driver-vehicle-select",
              value: d.vehicle ?? "sedan",
              disabled: busyId === d.id,
              onChange: (e) => void changeVehicle(d, e.target.value),
              "aria-label": `Preferred vehicle for ${d.name || d.email}`,
              children: vehicles.map((v) => /* @__PURE__ */ jsx("option", { value: v.id, children: v.name }, v.id))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "driver-row-actions", children: [
        /* @__PURE__ */ jsxs("span", { className: `status-chip status-chip-sm ${d.active ? "status-confirmed" : "status-no-show"}`, children: [
          /* @__PURE__ */ jsx("span", { className: "status-dot", style: { background: d.active ? STATUS_DOT.active : STATUS_DOT.inactive } }),
          d.active ? "Active" : "Inactive"
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "manage-link",
            disabled: busyId === d.id,
            onClick: () => void toggleActive(d),
            children: [
              /* @__PURE__ */ jsx(Power, { size: 14 }),
              " ",
              d.active ? "Deactivate" : "Activate"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "manage-link",
            style: { color: "#b5333b" },
            disabled: busyId === d.id,
            onClick: () => {
              setDeleteTarget(d);
              setDeleteError("");
            },
            children: [
              /* @__PURE__ */ jsx(Trash2, { size: 14 }),
              " Remove"
            ]
          }
        )
      ] })
    ] }, d.id)) }),
    deleteTarget && /* @__PURE__ */ jsx("div", { className: "trip-scrim", onClick: () => !deleting && setDeleteTarget(null), children: /* @__PURE__ */ jsxs("div", { className: "trip-confirm-dialog", onClick: (e) => e.stopPropagation(), role: "dialog", "aria-label": "Delete driver", children: [
      /* @__PURE__ */ jsx("div", { className: "trip-confirm-icon", children: /* @__PURE__ */ jsx(Trash2, { size: 22 }) }),
      /* @__PURE__ */ jsxs("h3", { children: [
        "Remove ",
        deleteTarget.name || deleteTarget.email,
        "?"
      ] }),
      /* @__PURE__ */ jsx("p", { children: "This deletes the driver account. Past reservations stay in your records; future trip assignments to this driver are cleared." }),
      deleteError && /* @__PURE__ */ jsx("p", { className: "trip-form-error", children: deleteError }),
      /* @__PURE__ */ jsxs("div", { className: "confirm-delete-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "ghost-button", disabled: deleting, onClick: () => setDeleteTarget(null), children: "Cancel" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "danger-button", disabled: deleting, onClick: () => void confirmDelete(), children: deleting ? "Removing…" : "Remove driver" })
      ] })
    ] }) })
  ] });
}
const FLEET_BASE_LAT = 40.8501;
const FLEET_BASE_LNG = -74.0608;
function formatAgo(iso) {
  if (!iso) return "Standby (Awaiting GPS lock)";
  const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1e3));
  if (diff < 15) return "Live (Just now)";
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}
function FleetMap({
  initialFocusedDriverId,
  onClose
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const leafletRef = useRef(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState(initialFocusedDriverId ?? null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const [actionInProgress, setActionInProgress] = useState(false);
  const [simulatingDriverId, setSimulatingDriverId] = useState(null);
  const simIntervalRef = useRef(null);
  const geocodeCache = useRef({});
  const [resolvedAddrs, setResolvedAddrs] = useState({});
  async function resolveAddressCoords(addr) {
    if (!addr) return null;
    if (geocodeCache.current[addr]) return geocodeCache.current[addr];
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(addr)}`);
      if (res.ok) {
        const data2 = await res.json();
        if (typeof data2.lat === "number" && typeof data2.lng === "number") {
          const coords = { lat: data2.lat, lng: data2.lng };
          geocodeCache.current[addr] = coords;
          setResolvedAddrs((prev) => ({ ...prev, [addr]: coords }));
          return coords;
        }
      }
    } catch {
    }
    return null;
  }
  async function loadFleet() {
    try {
      const res = await fetch("/api/driver-location", {
        headers: {
          Authorization: `Bearer ${pocketbaseClient.authStore.token}`
        }
      });
      if (!res.ok) {
        throw new Error("Failed to load fleet");
      }
      const data2 = await res.json();
      const list = data2.drivers || [];
      setDrivers(list);
      setLastRefreshed(Date.now());
      setError("");
      for (const d of list) {
        if (d.activeTrip?.pickup) void resolveAddressCoords(d.activeTrip.pickup);
        if (d.activeTrip?.dropoff) void resolveAddressCoords(d.activeTrip.dropoff);
      }
    } catch (err) {
      setError("Could not update live driver locations.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void loadFleet();
    const interval = window.setInterval(() => {
      void loadFleet();
    }, 8e3);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    let cancelled = false;
    async function initMap() {
      if (!containerRef.current) return;
      if (!leafletRef.current) {
        leafletRef.current = await import("leaflet");
      }
      const L = leafletRef.current;
      if (cancelled || !containerRef.current) return;
      if (!mapRef.current) {
        const map = L.map(containerRef.current, {
          center: [FLEET_BASE_LAT, FLEET_BASE_LNG],
          zoom: 11,
          zoomControl: false,
          attributionControl: true
        });
        L.control.zoom({ position: "topright" }).addTo(map);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 18
        }).addTo(map);
        mapRef.current = map;
        markersLayerRef.current = L.layerGroup().addTo(map);
        routeLayerRef.current = L.layerGroup().addTo(map);
      }
    }
    void initMap();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) {
        window.clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    };
  }, []);
  function getDriverLocation(d, index) {
    if (typeof d.lat === "number" && typeof d.lng === "number") {
      return {
        lat: d.lat,
        lng: d.lng,
        isLive: true,
        label: `${d.speed} mph`
      };
    }
    if (d.activeTrip?.pickup && geocodeCache.current[d.activeTrip.pickup]) {
      const p = geocodeCache.current[d.activeTrip.pickup];
      return {
        lat: p.lat,
        lng: p.lng,
        isLive: false,
        label: "Pickup Area (Standby)"
      };
    }
    const offset = index % 6 * 25e-4;
    return {
      lat: FLEET_BASE_LAT + offset,
      lng: FLEET_BASE_LNG + offset,
      isLive: false,
      label: "Teterboro Base (Standby)"
    };
  }
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    const routeLayer = routeLayerRef.current;
    if (!L || !map || !markersLayer || !routeLayer) return;
    markersLayer.clearLayers();
    routeLayer.clearLayers();
    const bounds = [];
    drivers.forEach((d, index) => {
      const loc = getDriverLocation(d, index);
      bounds.push([loc.lat, loc.lng]);
      const isSelected = d.id === selectedDriverId;
      const hasActiveTrip = Boolean(d.activeTrip);
      const tripStatus = d.activeTrip?.driverStatus || "idle";
      let statusColor = loc.isLive ? "#2563eb" : "#d97706";
      if (loc.isLive) {
        if (tripStatus === "accepted" || tripStatus === "on_the_way") statusColor = "#2563eb";
        else if (tripStatus === "arrived") statusColor = "#0284c7";
        else if (tripStatus === "on_board") statusColor = "#7c3aed";
        else if (!hasActiveTrip) statusColor = "#16a34a";
      }
      const markerHtml = `
        <div class="driver-map-pin ${isSelected ? "selected" : ""}" style="--pin-color: ${statusColor};">
          <div class="driver-pin-pulse" style="${loc.isLive ? "" : "animation-duration: 3s; opacity: 0.2;"}"></div>
          <div class="driver-pin-body" style="${loc.isLive ? "" : "border: 2px dashed #fff;"}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <path d="M9 17h6"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
          <div class="driver-pin-label">
            ${d.name.split(" ")[0]}${loc.isLive ? "" : " (Standby)"}
          </div>
        </div>
      `;
      const customIcon = L.divIcon({
        className: "driver-leaflet-marker",
        html: markerHtml,
        iconSize: [42, 42],
        iconAnchor: [21, 21]
      });
      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon });
      marker.on("click", () => {
        setSelectedDriverId(d.id);
        map.setView([loc.lat, loc.lng], Math.max(map.getZoom(), 13), { animate: true });
      });
      markersLayer.addLayer(marker);
      if (isSelected && d.activeTrip?.pickup) {
        void (async () => {
          const pickupCoords = await resolveAddressCoords(d.activeTrip.pickup);
          if (pickupCoords && mapRef.current) {
            const pBounds = [[loc.lat, loc.lng], [pickupCoords.lat, pickupCoords.lng]];
            const pickupIcon = L.divIcon({
              className: "route-marker-icon",
              html: `<span class="route-pin circle" style="--pin: #16a34a;">A</span>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });
            const pMarker = L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupIcon }).bindPopup(
              `<strong>Pickup Location:</strong><br/>${d.activeTrip.pickup}`
            );
            routeLayer.addLayer(pMarker);
            const connector = L.polyline(
              [
                [loc.lat, loc.lng],
                [pickupCoords.lat, pickupCoords.lng]
              ],
              {
                color: statusColor,
                weight: 4,
                dashArray: "8, 8",
                opacity: 0.85
              }
            );
            routeLayer.addLayer(connector);
            if (d.activeTrip.dropoff) {
              const dropCoords = await resolveAddressCoords(d.activeTrip.dropoff);
              if (dropCoords) {
                pBounds.push([dropCoords.lat, dropCoords.lng]);
                const dropIcon = L.divIcon({
                  className: "route-marker-icon",
                  html: `<span class="route-pin square" style="--pin: #2563eb;">B</span>`,
                  iconSize: [28, 28],
                  iconAnchor: [14, 14]
                });
                const dMarker = L.marker([dropCoords.lat, dropCoords.lng], { icon: dropIcon }).bindPopup(
                  `<strong>Dropoff:</strong><br/>${d.activeTrip.dropoff}`
                );
                routeLayer.addLayer(dMarker);
                const dropLine = L.polyline(
                  [
                    [pickupCoords.lat, pickupCoords.lng],
                    [dropCoords.lat, dropCoords.lng]
                  ],
                  {
                    color: "#2563eb",
                    weight: 3,
                    opacity: 0.6
                  }
                );
                routeLayer.addLayer(dropLine);
              }
            }
            map.fitBounds(L.latLngBounds(pBounds), { padding: [50, 50], maxZoom: 15 });
          }
        })();
      }
    });
    if (!selectedDriverId && bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 14 });
    }
  }, [drivers, selectedDriverId, resolvedAddrs]);
  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === selectedDriverId) || null,
    [drivers, selectedDriverId]
  );
  async function handlePlaceAtPickup(driver2) {
    if (!driver2.activeTrip?.pickup || actionInProgress) return;
    setActionInProgress(true);
    try {
      const coords = await resolveAddressCoords(driver2.activeTrip.pickup);
      if (!coords) throw new Error("Could not resolve pickup address coordinates.");
      await fetch("/api/driver-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pocketbaseClient.authStore.token}`
        },
        body: JSON.stringify({
          driverId: driver2.id,
          lat: coords.lat,
          lng: coords.lng,
          speed: 0,
          heading: 0,
          tripId: driver2.activeTrip.id,
          onDuty: true
        })
      });
      await loadFleet();
      if (mapRef.current) {
        mapRef.current.setView([coords.lat, coords.lng], 14, { animate: true });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not place driver at pickup.");
    } finally {
      setActionInProgress(false);
    }
  }
  async function handlePlaceAtBase(driver2) {
    if (actionInProgress) return;
    setActionInProgress(true);
    try {
      await fetch("/api/driver-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pocketbaseClient.authStore.token}`
        },
        body: JSON.stringify({
          driverId: driver2.id,
          lat: FLEET_BASE_LAT,
          lng: FLEET_BASE_LNG,
          speed: 0,
          heading: 90,
          onDuty: true
        })
      });
      await loadFleet();
      if (mapRef.current) {
        mapRef.current.setView([FLEET_BASE_LAT, FLEET_BASE_LNG], 14, { animate: true });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not place driver at base.");
    } finally {
      setActionInProgress(false);
    }
  }
  async function toggleSimulation(driver2) {
    if (simulatingDriverId === driver2.id) {
      if (simIntervalRef.current) {
        window.clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      setSimulatingDriverId(null);
      return;
    }
    if (simIntervalRef.current) {
      window.clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setSimulatingDriverId(driver2.id);
    let target = { lat: 40.758, lng: -73.9855 };
    if (driver2.activeTrip?.pickup) {
      const p = await resolveAddressCoords(driver2.activeTrip.pickup);
      if (p) target = p;
    }
    let curLat = driver2.lat ?? FLEET_BASE_LAT;
    let curLng = driver2.lng ?? FLEET_BASE_LNG;
    simIntervalRef.current = window.setInterval(async () => {
      const dLat = target.lat - curLat;
      const dLng = target.lng - curLng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < 3e-3) {
        if (simIntervalRef.current) {
          window.clearInterval(simIntervalRef.current);
          simIntervalRef.current = null;
        }
        setSimulatingDriverId(null);
        return;
      }
      const nextLat = curLat + dLat * 0.12;
      const nextLng = curLng + dLng * 0.12;
      curLat = nextLat;
      curLng = nextLng;
      const heading = Math.round(Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;
      const speed = 36;
      try {
        await fetch("/api/driver-location", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pocketbaseClient.authStore.token}`
          },
          body: JSON.stringify({
            driverId: driver2.id,
            lat: nextLat,
            lng: nextLng,
            heading,
            speed,
            tripId: driver2.activeTrip?.id,
            onDuty: true
          })
        });
        setDrivers(
          (prev) => prev.map(
            (d) => d.id === driver2.id ? {
              ...d,
              lat: nextLat,
              lng: nextLng,
              heading,
              speed,
              lastLocationUpdate: (/* @__PURE__ */ new Date()).toISOString()
            } : d
          )
        );
      } catch {
      }
    }, 3200);
  }
  const visibleDrivers = drivers.filter((d) => {
    if (filter === "active" && !d.activeTrip) return false;
    if (filter === "idle" && d.activeTrip) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return d.name.toLowerCase().includes(q) || (d.vehicle || "").toLowerCase().includes(q) || (d.activeTrip?.passengerName || "").toLowerCase().includes(q) || (d.activeTrip?.pickup || "").toLowerCase().includes(q);
    }
    return true;
  });
  const liveGpsCount = drivers.filter((d) => typeof d.lat === "number" && typeof d.lng === "number").length;
  return /* @__PURE__ */ jsxs("div", { className: "fleet-view-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "fleet-view-head", children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
        /* @__PURE__ */ jsx("div", { className: "fleet-live-pulse" }),
        /* @__PURE__ */ jsx("h2", { style: { margin: 0, fontSize: 18, fontWeight: 800 }, children: "Elite Limo Link • Live Driver View" }),
        /* @__PURE__ */ jsxs("span", { className: "driver-brand-tag", style: { background: "#e0f2fe", color: "#0369a1", borderColor: "#bae6fd" }, children: [
          liveGpsCount,
          " Live GPS • ",
          drivers.length - liveGpsCount,
          " Standby (",
          drivers.length,
          " Visible)"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
        /* @__PURE__ */ jsxs("button", { type: "button", className: "driver-tool-btn", onClick: () => void loadFleet(), title: "Refresh GPS", children: [
          /* @__PURE__ */ jsx(RefreshCw, { size: 13, className: loading ? "animate-spin" : "" }),
          " Refresh"
        ] }),
        onClose && /* @__PURE__ */ jsxs("button", { type: "button", className: "driver-tool-btn", onClick: onClose, children: [
          /* @__PURE__ */ jsx(X, { size: 15 }),
          " Close Map"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "fleet-grid", children: [
      /* @__PURE__ */ jsxs("aside", { className: "fleet-sidebar", children: [
        /* @__PURE__ */ jsxs("div", { className: "driver-tab-group", style: { width: "100%", marginBottom: 12 }, children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: `driver-tab-btn${filter === "all" ? " active" : ""}`,
              style: { flex: 1, justifyContent: "center" },
              onClick: () => setFilter("all"),
              children: [
                "All (",
                drivers.length,
                ")"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: `driver-tab-btn${filter === "active" ? " active" : ""}`,
              style: { flex: 1, justifyContent: "center" },
              onClick: () => setFilter("active"),
              children: [
                "On Mission (",
                drivers.filter((d) => Boolean(d.activeTrip)).length,
                ")"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: `driver-tab-btn${filter === "idle" ? " active" : ""}`,
              style: { flex: 1, justifyContent: "center" },
              onClick: () => setFilter("idle"),
              children: "Available"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "driver-search-wrap", style: { width: "100%", maxWidth: "100%", marginBottom: 12 }, children: [
          /* @__PURE__ */ jsx(Search, { size: 14 }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "search",
              placeholder: "Search driver, car, guest…",
              value: search,
              onChange: (e) => setSearch(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "fleet-roster", children: visibleDrivers.length === 0 ? /* @__PURE__ */ jsx("p", { style: { textAlign: "center", padding: "30px 10px", color: "var(--ink-light)", fontSize: 13 }, children: "No drivers found." }) : visibleDrivers.map((d, idx) => {
          const isSelected = d.id === selectedDriverId;
          const loc = getDriverLocation(d, idx);
          const trip = d.activeTrip;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: `fleet-driver-card${isSelected ? " selected" : ""}`,
              onClick: () => {
                setSelectedDriverId(d.id);
                if (mapRef.current) {
                  mapRef.current.setView([loc.lat, loc.lng], 14, { animate: true });
                }
              },
              children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }, children: [
                  /* @__PURE__ */ jsx("strong", { style: { fontSize: 14, color: "var(--ink)" }, children: d.name }),
                  /* @__PURE__ */ jsx("span", { className: `fleet-status-pill ${trip ? "active" : loc.isLive ? "idle" : "standby"}`, children: trip ? trip.driverStatus.replace(/_/g, " ").toUpperCase() : loc.isLive ? "LIVE GPS" : "STANDBY" })
                ] }),
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--ink-mid)" }, children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx(CarFront, { size: 13, style: { display: "inline", marginRight: 3 } }),
                    " ",
                    d.vehicle
                  ] }),
                  /* @__PURE__ */ jsx("span", { children: "•" }),
                  /* @__PURE__ */ jsx("span", { children: loc.isLive ? `${d.speed} mph` : "Awaiting Phone GPS" })
                ] }),
                trip && /* @__PURE__ */ jsxs("div", { className: "fleet-driver-trip-summary", children: [
                  /* @__PURE__ */ jsxs("span", { style: { fontWeight: 700, color: "#1e40af" }, children: [
                    "Passenger: ",
                    trip.passengerName
                  ] }),
                  /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: "var(--ink-mid)", marginTop: 2 }, children: [
                    "📍 Pickup: ",
                    trip.pickup
                  ] })
                ] })
              ]
            },
            d.id
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "fleet-map-wrapper", children: [
        /* @__PURE__ */ jsx("div", { ref: containerRef, className: "fleet-leaflet-map" }),
        selectedDriver && /* @__PURE__ */ jsxs("div", { className: "fleet-floating-card", children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }, children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { style: { margin: 0, fontSize: 16, fontWeight: 800 }, children: selectedDriver.name }),
              /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: "var(--ink-mid)", marginTop: 2 }, children: [
                selectedDriver.vehicle.toUpperCase(),
                " • ",
                formatAgo(selectedDriver.lastLocationUpdate)
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                style: { border: 0, background: "transparent", cursor: "pointer", color: "var(--ink-light)" },
                onClick: () => setSelectedDriverId(null),
                children: /* @__PURE__ */ jsx(X, { size: 18 })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 14, marginTop: 10, fontSize: 12 }, children: [
            /* @__PURE__ */ jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ jsx(Gauge, { size: 14, color: "#2563eb" }),
              " ",
              /* @__PURE__ */ jsxs("strong", { children: [
                selectedDriver.speed,
                " mph"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ jsx(Compass, { size: 14, color: "#0284c7" }),
              " ",
              /* @__PURE__ */ jsxs("strong", { children: [
                selectedDriver.heading,
                "° Heading"
              ] })
            ] }),
            selectedDriver.phone && /* @__PURE__ */ jsxs(
              "a",
              {
                href: `tel:${selectedDriver.phone.replace(/[^\d+]/g, "")}`,
                style: { marginLeft: "auto", color: "#16a34a", fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 },
                children: [
                  /* @__PURE__ */ jsx(Phone, { size: 13 }),
                  " Call Chauffeur"
                ]
              }
            )
          ] }),
          selectedDriver.activeTrip ? /* @__PURE__ */ jsxs("div", { style: { marginTop: 12, padding: 12, background: "#f8fbff", borderRadius: 10, border: "1px solid #dbeafe" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ jsxs("span", { style: { fontSize: 12, fontWeight: 800, color: "#1e40af" }, children: [
                "CURRENT MISSION: ",
                selectedDriver.activeTrip.driverStatus.replace(/_/g, " ").toUpperCase()
              ] }),
              /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, fontWeight: 700, color: "var(--ink-light)" }, children: [
                "Guest: ",
                selectedDriver.activeTrip.passengerName
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, marginTop: 6, color: "var(--ink)" }, children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Pickup:" }),
                " ",
                selectedDriver.activeTrip.pickup
              ] }),
              selectedDriver.activeTrip.dropoff && /* @__PURE__ */ jsxs("div", { style: { marginTop: 3 }, children: [
                /* @__PURE__ */ jsx("strong", { children: "Dropoff:" }),
                " ",
                selectedDriver.activeTrip.dropoff
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { marginTop: 8, fontSize: 11, color: "#15803d", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }, children: [
              /* @__PURE__ */ jsx(Navigation, { size: 13 }),
              typeof selectedDriver.lat === "number" ? "Live GPS Tracked: Chauffeur broadcast streaming" : "Standby on Map: Awaiting phone GPS broadcast"
            ] })
          ] }) : /* @__PURE__ */ jsx("div", { style: { marginTop: 10, fontSize: 12, color: "var(--ink-mid)" }, children: "Driver is on duty and available for assignments." }),
          /* @__PURE__ */ jsxs("div", { className: "fleet-dispatch-box", style: { marginTop: 12 }, children: [
            /* @__PURE__ */ jsx("span", { style: { fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--ink-mid)" }, children: "Dispatcher Position & Test Controls:" }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }, children: [
              selectedDriver.activeTrip?.pickup && /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "fleet-action-btn place-pickup",
                  onClick: () => void handlePlaceAtPickup(selectedDriver),
                  disabled: actionInProgress,
                  children: [
                    /* @__PURE__ */ jsx(MapPin, { size: 13 }),
                    " Place at Pickup Address"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "fleet-action-btn place-base",
                  onClick: () => void handlePlaceAtBase(selectedDriver),
                  disabled: actionInProgress,
                  children: [
                    /* @__PURE__ */ jsx(Building, { size: 13 }),
                    " Place at Teterboro Base"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: `fleet-action-btn ${simulatingDriverId === selectedDriver.id ? "sim-stop" : "sim-start"}`,
                  onClick: () => void toggleSimulation(selectedDriver),
                  children: [
                    simulatingDriverId === selectedDriver.id ? /* @__PURE__ */ jsx(Square, { size: 13 }) : /* @__PURE__ */ jsx(Play, { size: 13 }),
                    simulatingDriverId === selectedDriver.id ? "Stop Simulation" : "Simulate Live Drive (36 mph)"
                  ]
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function relTime(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const sec = Math.round(diff / 1e3);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function shortRef$1(id) {
  return `#${id.slice(-6).toUpperCase()}`;
}
const STATUS_LABEL = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show"
};
function ActivityStream({ reservations }) {
  const tierName = useVehicleTierName();
  const [interactions, setInteractions] = useState([]);
  useEffect(() => {
    let active = true;
    pocketbaseClient.collection("activity_events").getFullList({ sort: "-created", perPage: 200, requestKey: null }).then((rows) => {
      if (active) setInteractions(rows);
    }).catch(() => {
    });
    void pocketbaseClient.collection("activity_events").subscribe("*", (e) => {
      if (e.action === "delete") {
        setInteractions((prev) => prev.filter((r) => r.id !== e.record.id));
        return;
      }
      const next = e.record;
      setInteractions(
        (prev) => prev.some((r) => r.id === next.id) ? prev.map((r) => r.id === next.id ? next : r) : [next, ...prev]
      );
    }).catch(() => {
    });
    return () => {
      active = false;
      void pocketbaseClient.collection("activity_events").unsubscribe("*").catch(() => {
      });
    };
  }, []);
  const reservationEntries = useMemo(() => {
    const mapped = reservations.map((r) => {
      const created = r.created ? new Date(r.created).getTime() : 0;
      const updated = r.updated ? new Date(r.updated).getTime() : 0;
      const kind = updated - created > 1500 ? "update" : "create";
      const when = kind === "update" ? r.updated : r.created;
      return {
        id: `${r.id}-${when}`,
        reservationId: r.id,
        kind,
        when,
        name: r.name || "Unnamed guest",
        sourceName: (r.sourceName || "").trim(),
        pickup: r.pickup,
        dropoff: r.dropoff,
        flight: r.flight,
        status: normalizeStatus(r.status),
        paid: Boolean(r.paid),
        vehicle: r.vehicle,
        passengers: r.passengers,
        roundTrip: Boolean(r.returnAt || r.returnLocal)
      };
    });
    return mapped;
  }, [reservations]);
  const interactionEntries = useMemo(() => {
    return interactions.map((e) => ({
      id: e.id,
      kind: "interaction",
      when: e.created,
      type: e.type || "click",
      label: e.label,
      step: e.meta?.step,
      area: e.meta?.area,
      session: e.session,
      page: e.page,
      location: e.meta?.location,
      locationApprox: e.meta?.locationApprox,
      device: e.meta?.device,
      browser: e.meta?.browser,
      os: e.meta?.os,
      referrer: e.meta?.referrer,
      language: e.meta?.language,
      viewport: e.meta?.viewport
    }));
  }, [interactions]);
  const feed = useMemo(() => {
    const combined = [
      ...reservationEntries.map((e) => ({ ...e, source: "reservation" })),
      ...interactionEntries.map((e) => ({ ...e, source: "interaction" }))
    ];
    combined.sort((a, b) => {
      const ta = a.when ? new Date(a.when).getTime() : 0;
      const tb = b.when ? new Date(b.when).getTime() : 0;
      return tb - ta;
    });
    return combined.slice(0, 80);
  }, [reservationEntries, interactionEntries]);
  const newCount = reservationEntries.filter((e) => e.kind === "create").length;
  const updateCount = reservationEntries.length - newCount;
  const visitCount = interactionEntries.filter((e) => e.type === "visit").length;
  const interactionCount = interactionEntries.length - visitCount;
  return /* @__PURE__ */ jsxs("div", { className: "activity-stream", children: [
    /* @__PURE__ */ jsxs("div", { className: "activity-stream-head", children: [
      /* @__PURE__ */ jsxs("div", { className: "activity-live", children: [
        /* @__PURE__ */ jsx("span", { className: "activity-live-dot" }),
        /* @__PURE__ */ jsx("span", { children: "Live" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "activity-stream-summary", children: [
        visitCount,
        " visits · ",
        newCount,
        " new · ",
        updateCount,
        " updated · ",
        interactionCount,
        " site interactions"
      ] })
    ] }),
    feed.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "activity-empty", children: [
      /* @__PURE__ */ jsx(Clock, { size: 26 }),
      /* @__PURE__ */ jsx("p", { children: "No activity yet. New bookings, updates, and visitor interactions will appear here in real time." })
    ] }) : /* @__PURE__ */ jsx("ol", { className: "activity-feed", children: feed.map((e) => /* @__PURE__ */ jsx("li", { className: "activity-item", children: e.source === "reservation" ? /* @__PURE__ */ jsx(ReservationEntryView, { entry: e, tierName }) : /* @__PURE__ */ jsx(InteractionEntryView, { entry: e }) }, `${e.source}-${e.id}`)) }),
    /* @__PURE__ */ jsx("p", { className: "activity-footnote", children: "Updates in real time. Site-visit entries show the page, timestamp, approximate IP-derived location (city/region/country), and browser/device — never precise GPS, passwords, or payment details. Location is labeled unavailable when it can't be reliably determined." })
  ] });
}
function ReservationEntryView({
  entry: e,
  tierName
}) {
  const isNew = e.kind === "create";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: `activity-icon ${isNew ? "is-new" : "is-update"}`, children: isNew ? /* @__PURE__ */ jsx(CalendarPlus, { size: 15 }) : /* @__PURE__ */ jsx(Edit3, { size: 15 }) }),
    /* @__PURE__ */ jsxs("div", { className: "activity-body", children: [
      /* @__PURE__ */ jsxs("div", { className: "activity-top", children: [
        /* @__PURE__ */ jsx("span", { className: `activity-kind ${isNew ? "is-new" : "is-update"}`, children: isNew ? "New booking" : "Updated" }),
        /* @__PURE__ */ jsx("span", { className: "activity-ref", children: shortRef$1(e.reservationId) }),
        /* @__PURE__ */ jsx("time", { className: "activity-time", dateTime: e.when || void 0, children: relTime(e.when) })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "activity-customer", children: [
        e.name,
        e.sourceName && /* @__PURE__ */ jsx("span", { className: "activity-source", children: e.sourceName })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "activity-route", children: [
        e.flight ? /* @__PURE__ */ jsxs("span", { className: "activity-flight", children: [
          /* @__PURE__ */ jsx(Plane, { size: 13 }),
          " ",
          e.flight
        ] }) : null,
        e.pickup && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("span", { className: "activity-pin pickup" }),
          /* @__PURE__ */ jsx("span", { children: e.pickup })
        ] }),
        e.dropoff && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(ArrowRight, { size: 12, className: "activity-arrow" }),
          /* @__PURE__ */ jsx("span", { className: "activity-pin drop" }),
          /* @__PURE__ */ jsx("span", { children: e.dropoff })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "activity-meta", children: [
        /* @__PURE__ */ jsxs("span", { className: `activity-status status-${e.status === "no_show" ? "no-show" : e.status}`, children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 12 }),
          " ",
          STATUS_LABEL[e.status]
        ] }),
        e.paid && /* @__PURE__ */ jsxs("span", { className: "activity-paid", children: [
          /* @__PURE__ */ jsx(CreditCard, { size: 12 }),
          " Paid"
        ] }),
        e.roundTrip && /* @__PURE__ */ jsxs("span", { className: "activity-round", children: [
          /* @__PURE__ */ jsx(RefreshCw, { size: 12 }),
          " Round trip"
        ] }),
        e.vehicle && /* @__PURE__ */ jsx("span", { className: "activity-vehicle", children: tierName(e.vehicle) }),
        e.passengers > 0 && /* @__PURE__ */ jsxs("span", { className: "activity-pax", children: [
          /* @__PURE__ */ jsx(Users, { size: 12 }),
          " ",
          e.passengers
        ] })
      ] })
    ] })
  ] });
}
function deviceIcon(device) {
  if (device === "Mobile") return /* @__PURE__ */ jsx(Smartphone, { size: 12 });
  if (device === "Tablet") return /* @__PURE__ */ jsx(Tablet, { size: 12 });
  if (device) return /* @__PURE__ */ jsx(Monitor, { size: 12 });
  return null;
}
function InteractionEntryView({ entry: e }) {
  const isVisit = e.type === "visit";
  const isAddress = e.type === "address";
  const isAction = e.type === "action";
  const locationLabel2 = e.locationApprox && e.location ? e.location : e.location ? `~${e.location}` : "";
  if (isVisit) {
    const deviceBits = [e.device, e.browser, e.os].filter(Boolean);
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "activity-icon is-visit", children: /* @__PURE__ */ jsx(Globe, { size: 15 }) }),
      /* @__PURE__ */ jsxs("div", { className: "activity-body", children: [
        /* @__PURE__ */ jsxs("div", { className: "activity-top", children: [
          /* @__PURE__ */ jsx("span", { className: "activity-kind is-visit", children: "Site visit" }),
          e.page && /* @__PURE__ */ jsx("span", { className: "activity-step", children: e.page }),
          /* @__PURE__ */ jsx("time", { className: "activity-time", dateTime: e.when || void 0, children: relTime(e.when) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "activity-interaction-label", children: e.label }),
        /* @__PURE__ */ jsxs("div", { className: "activity-meta", children: [
          locationLabel2 ? /* @__PURE__ */ jsxs("span", { className: "activity-location", children: [
            /* @__PURE__ */ jsx(MapPin, { size: 12 }),
            " ",
            locationLabel2,
            " ",
            /* @__PURE__ */ jsx("em", { children: "approx." })
          ] }) : /* @__PURE__ */ jsxs("span", { className: "activity-location activity-location-na", children: [
            /* @__PURE__ */ jsx(MapPin, { size: 12 }),
            " Location unavailable"
          ] }),
          deviceBits.length > 0 && /* @__PURE__ */ jsxs("span", { className: "activity-device", children: [
            deviceIcon(e.device),
            " ",
            deviceBits.join(" · ")
          ] }),
          e.referrer && /* @__PURE__ */ jsxs("span", { className: "activity-referrer", children: [
            /* @__PURE__ */ jsx(ExternalLink, { size: 12 }),
            " from ",
            e.referrer
          ] }),
          e.language && /* @__PURE__ */ jsxs("span", { className: "activity-lang", children: [
            /* @__PURE__ */ jsx(Globe, { size: 12 }),
            " ",
            e.language
          ] }),
          e.viewport && /* @__PURE__ */ jsx("span", { className: "activity-viewport", children: e.viewport }),
          e.session && /* @__PURE__ */ jsxs("span", { className: "activity-session", children: [
            "visitor ",
            e.session.slice(-6)
          ] })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: `activity-icon ${isAddress ? "is-address" : isAction ? "is-action" : "is-click"}`, children: /* @__PURE__ */ jsx(MousePointerClick, { size: 15 }) }),
    /* @__PURE__ */ jsxs("div", { className: "activity-body", children: [
      /* @__PURE__ */ jsxs("div", { className: "activity-top", children: [
        /* @__PURE__ */ jsx("span", { className: `activity-kind ${isAddress ? "is-address" : isAction ? "is-action" : "is-click"}`, children: isAddress ? "Address selected" : isAction ? "Booking action" : "Click" }),
        e.step && /* @__PURE__ */ jsxs("span", { className: "activity-step", children: [
          "Step ",
          e.step
        ] }),
        /* @__PURE__ */ jsx("time", { className: "activity-time", dateTime: e.when || void 0, children: relTime(e.when) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "activity-interaction-label", children: e.label }),
      /* @__PURE__ */ jsxs("div", { className: "activity-meta", children: [
        locationLabel2 && /* @__PURE__ */ jsxs("span", { className: "activity-location", children: [
          /* @__PURE__ */ jsx(MapPin, { size: 12 }),
          " ",
          locationLabel2
        ] }),
        e.area && /* @__PURE__ */ jsxs("span", { className: "activity-area", children: [
          "📍 ",
          e.area
        ] }),
        e.device && /* @__PURE__ */ jsxs("span", { className: "activity-device", children: [
          deviceIcon(e.device),
          " ",
          e.device
        ] }),
        e.session && /* @__PURE__ */ jsxs("span", { className: "activity-session", children: [
          "visitor ",
          e.session.slice(-6)
        ] })
      ] })
    ] })
  ] });
}
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${pocketbaseClient.authStore.token}`
  };
}
const RANGE_LABEL = {
  "7": "Next 7 days",
  "30": "Next 30 days",
  "90": "Next 90 days",
  upcoming: "All upcoming",
  all: "All dates"
};
function shortRef(id) {
  return `#${id.slice(-6).toUpperCase()}`;
}
function ordinal(day) {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  const mod10 = day % 10;
  if (mod10 === 1) return `${day}st`;
  if (mod10 === 2) return `${day}nd`;
  if (mod10 === 3) return `${day}rd`;
  return `${day}th`;
}
function headingFor(date) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  return `${weekday}, ${month} ${ordinal(date.getDate())}`;
}
function clock(iso) {
  if (!iso) return "TBD";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function dayKey(iso) {
  if (!iso) return "unscheduled";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unscheduled";
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function looksAirport(text) {
  return /airport|laguardia|lga|jfk|ewr|newark|kennedy|teterboro|teb|isp|hpn|swf/i.test(text);
}
function inRange(iso, range) {
  if (range === "all") return true;
  if (!iso) return range === "upcoming" ? false : false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  const start = /* @__PURE__ */ new Date();
  start.setHours(0, 0, 0, 0);
  if (t < start.getTime()) return false;
  if (range === "upcoming") return true;
  const end = start.getTime() + Number(range) * 24 * 60 * 60 * 1e3;
  return t < end;
}
function playAlertSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    const tones = [784, 1047];
    tones.forEach((freq, i) => {
      const t = now + i * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
    window.setTimeout(() => ctx.close(), 1200);
  } catch {
  }
}
function TripBoard({
  email,
  userId
}) {
  const navigate = useNavigate();
  const tierName = useVehicleTierName();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState("trips");
  const [focusedFleetDriverId, setFocusedFleetDriverId] = useState(void 0);
  const [notesOpen, setNotesOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [range, setRange] = useState("30");
  const [order, setOrder] = useState("oldest");
  const [status, setStatus] = useState("all");
  const [business, setBusiness] = useState("all");
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [bizMenuOpen, setBizMenuOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [copiedBizId, setCopiedBizId] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ businessName: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [addLink, setAddLink] = useState("");
  const [addLinkCopied, setAddLinkCopied] = useState(false);
  useRef(false);
  const reconcileTimer = useRef(null);
  const knownIds = useRef(/* @__PURE__ */ new Set());
  const initialized = useRef(false);
  const soundOnRef = useRef(true);
  const [soundOn, setSoundOn] = useState(true);
  const mainBusiness = businesses[0]?.businessName ?? "";
  async function load() {
    setLoading(true);
    setError("");
    try {
      const records = await pocketbaseClient.collection("reservations").getFullList({
        sort: "-created",
        requestKey: null
      });
      setAll(records);
      knownIds.current = new Set(records.map((r) => r.id));
      initialized.current = true;
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError("Couldn’t load reservations. Please sign in again.");
    } finally {
      setLoading(false);
    }
  }
  async function refresh() {
    try {
      const records = await pocketbaseClient.collection("reservations").getFullList({
        sort: "-created",
        requestKey: null
      });
      setAll(records);
      announceNew(records);
    } catch (err) {
      if (handlePbAuthError(err)) return;
    }
  }
  function announceNew(records) {
    if (!initialized.current) return;
    let foundNew = false;
    for (const r of records) {
      if (!knownIds.current.has(r.id)) {
        knownIds.current.add(r.id);
        foundNew = true;
      }
    }
    if (foundNew && soundOnRef.current) playAlertSound();
  }
  useEffect(() => {
    try {
      const stored = localStorage.getItem("dash-sound");
      if (stored !== null) {
        const on = stored === "1";
        setSoundOn(on);
        soundOnRef.current = on;
      }
    } catch {
    }
  }, []);
  useEffect(() => {
    soundOnRef.current = soundOn;
    try {
      localStorage.setItem("dash-sound", soundOn ? "1" : "0");
    } catch {
    }
  }, [soundOn]);
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const onPageShow = (e) => {
      if (e.persisted || document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(tick, 6e4);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    void pocketbaseClient.collection("reservations").subscribe("*", (e) => {
      if (e.action !== "delete") {
        const next = e.record;
        if (initialized.current && !knownIds.current.has(next.id)) {
          knownIds.current.add(next.id);
          if (soundOnRef.current) playAlertSound();
        }
      }
      setAll((prev) => {
        if (e.action === "delete") return prev.filter((r) => r.id !== e.record.id);
        const next = e.record;
        return prev.some((r) => r.id === next.id) ? prev.map((r) => r.id === next.id ? next : r) : [next, ...prev];
      });
      if (reconcileTimer.current) window.clearTimeout(reconcileTimer.current);
      reconcileTimer.current = window.setTimeout(() => {
        void refresh();
      }, 2500);
    }).catch(() => {
    });
    return () => {
      if (reconcileTimer.current) window.clearTimeout(reconcileTimer.current);
      void pocketbaseClient.collection("reservations").unsubscribe("*").catch(() => {
      });
    };
  }, []);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = all.filter((r) => {
      if (status !== "all" && normalizeStatus(r.status) !== status) return false;
      if (!inRange(r.pickupAt, range)) return false;
      if (business !== "all") {
        const name = (r.sourceName || "").trim() || mainBusiness || "Unassigned";
        if (name !== business) return false;
      }
      if (!q) return true;
      const hay = `${r.name} ${r.email} ${r.phone} ${r.pickup} ${r.dropoff} ${r.flight} ${r.sourceName} ${r.id} ${shortRef(r.id)} RB-${r.id.slice(-8).toUpperCase()}`.toLowerCase();
      return hay.includes(q);
    });
    list.sort((a, b) => {
      const ta = a.pickupAt ? new Date(a.pickupAt).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.pickupAt ? new Date(b.pickupAt).getTime() : Number.POSITIVE_INFINITY;
      return order === "oldest" ? ta - tb : tb - ta;
    });
    return list;
  }, [all, search, range, order, status, business]);
  const groups = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const row of visible) {
      const key = dayKey(row.pickupAt);
      const label = key === "unscheduled" ? "Date to confirm" : headingFor(new Date(row.pickupAt));
      const bucket = map.get(key) ?? { label, rows: [] };
      bucket.rows.push(row);
      map.set(key, bucket);
    }
    return [...map.values()];
  }, [visible]);
  const pendingNotes = all.filter((r) => normalizeStatus(r.status) === "pending").slice(0, 8);
  const summary = `${RANGE_LABEL[range]}, ${order === "oldest" ? "oldest" : "newest"} trip date first`;
  const businessLabel = business === "all" ? "All businesses" : business;
  const selectorBusinesses = useMemo(() => {
    const active = businesses.filter((b) => b.businessName).map((b) => ({
      id: b.id,
      name: b.businessName,
      count: all.filter((r) => ((r.sourceName || "").trim() || mainBusiness) === b.businessName).length
    }));
    const activeNames = new Set(active.map((b) => b.name.toLowerCase()));
    const orphanCounts = /* @__PURE__ */ new Map();
    for (const r of all) {
      const src = (r.sourceName || "").trim();
      if (!src) continue;
      if (activeNames.has(src.toLowerCase())) continue;
      orphanCounts.set(src, (orphanCounts.get(src) || 0) + 1);
    }
    const orphans = [...orphanCounts.entries()].map(([name, count]) => ({
      id: "",
      name,
      count
    }));
    return [...active, ...orphans];
  }, [businesses, all, mainBusiness]);
  async function loadBusinesses() {
    try {
      const res = await fetch(`/api/businesses?t=${Date.now()}`);
      if (!res.ok) return;
      const data2 = await res.json();
      setBusinesses(data2.businesses || []);
    } catch {
    }
  }
  async function loadDrivers() {
    try {
      const rows = await pocketbaseClient.collection("drivers").getFullList({
        sort: "name",
        requestKey: null
      });
      setDrivers(rows);
    } catch {
    }
  }
  function driverName(id) {
    if (!id) return "";
    const d = drivers.find((x) => x.id === id);
    return d ? d.name || d.email : "";
  }
  useEffect(() => {
    void loadBusinesses();
    void loadDrivers();
  }, []);
  const effectiveBusinessId = selectedBusinessId || userId || "";
  const settingsBusinessLabel = businesses.find((b) => b.id === effectiveBusinessId)?.businessName || "";
  function onSettingsSaved(newName) {
    const trimmed = (newName || "").trim();
    if (trimmed) {
      setBusinesses(
        (prev) => prev.map((b) => b.id === effectiveBusinessId ? { ...b, businessName: trimmed } : b)
      );
    }
    void loadBusinesses();
    if (business !== "all") setBusiness(trimmed);
  }
  async function copyAddLink() {
    if (!addLink) return;
    try {
      await navigator.clipboard.writeText(addLink);
      setAddLinkCopied(true);
      window.setTimeout(() => setAddLinkCopied(false), 2e3);
    } catch {
    }
  }
  function toBizSlug(name, id) {
    const s = (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return s || id || "";
  }
  function getBizLink(b, isOwn) {
    if (typeof window === "undefined") return "";
    if (isOwn) return `${window.location.origin}/`;
    const slug = toBizSlug(b.businessName, b.id);
    return `${window.location.origin}/${slug}`;
  }
  async function copyBizLink(link, id) {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedBizId(id);
      window.setTimeout(() => setCopiedBizId(""), 2e3);
    } catch {
    }
  }
  function openBizContextMenu(id, name, x, y) {
    const clampedX = Math.min(Math.max(x, 8), window.innerWidth - 200);
    const clampedY = Math.min(Math.max(y, 8), window.innerHeight - 90);
    setContextMenu({ id, name, x: clampedX, y: clampedY });
  }
  async function confirmDeleteBusiness() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/businesses", {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ biz: deleteTarget.id })
      });
      const data2 = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data2.error || "Could not delete business.");
        err.status = res.status;
        if (handlePbAuthError(err)) return;
        setDeleteError(data2.error || "Could not delete business.");
        return;
      }
      if (selectedBusinessId === deleteTarget.id) {
        setBusiness("all");
        setSelectedBusinessId("");
      }
      setDeleteTarget(null);
      setContextMenu(null);
      await Promise.all([loadBusinesses(), load()]);
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }
  async function submitBusiness() {
    setAdding(true);
    setAddError("");
    setAddSuccess("");
    setAddLink("");
    setAddLinkCopied(false);
    const name = addForm.businessName.trim();
    if (!name) {
      setAddError("Business name is required.");
      setAdding(false);
      return;
    }
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ businessName: name })
      });
      const data2 = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data2.error || "Could not create business.");
        err.status = res.status;
        if (handlePbAuthError(err)) return;
        setAddError(data2.error || "Could not create business.");
        return;
      }
      setAddLink(getBizLink({ id: data2.id, businessName: name }, false));
      setAddSuccess(`Created “${name}”.`);
      setAddForm({ businessName: "" });
      await loadBusinesses();
    } catch {
      setAddError("Network error. Please try again.");
    } finally {
      setAdding(false);
    }
  }
  const selected = selectedId ? all.find((r) => r.id === selectedId) ?? null : null;
  async function setTripStatus(id, next) {
    const current = all.find((r) => r.id === id);
    if (!current || normalizeStatus(current.status) === next) return;
    setSavingId(id);
    setAll((prev) => prev.map((r) => r.id === id ? { ...r, status: next } : r));
    try {
      await pocketbaseClient.collection("reservations").update(id, { status: next });
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setAll((prev) => prev.map((r) => r.id === id ? current : r));
    } finally {
      setSavingId(null);
    }
  }
  function signOut() {
    pocketbaseClient.authStore.clear();
    navigate("/login");
  }
  return /* @__PURE__ */ jsxs("div", { className: "trip-dash", children: [
    /* @__PURE__ */ jsxs("header", { className: "trip-top", children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "trip-icon-btn", "aria-label": "Open menu", onClick: () => setMenuOpen(true), children: /* @__PURE__ */ jsx(Menu, { size: 26, strokeWidth: 2.25 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 10, fontWeight: 800, letterSpacing: ".08em", color: "#2563eb", textTransform: "uppercase", display: "block", lineHeight: 1 }, children: "Elite Limo Link" }),
          /* @__PURE__ */ jsx("h1", { style: { margin: 0, fontSize: 19, lineHeight: 1.2 }, children: "Dashboard" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "trip-top-actions", children: [
        /* @__PURE__ */ jsx(ThemeToggle, { className: "trip-icon-btn", label: "Toggle day or night mode" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: `trip-icon-btn${panel === "fleet" ? " trip-icon-btn-active" : ""}`,
            "aria-label": "Drive View & Fleet Map",
            title: "Drive View & Canlı Harita Takibi",
            onClick: () => {
              setFocusedFleetDriverId(void 0);
              setPanel(panel === "fleet" ? "trips" : "fleet");
            },
            children: /* @__PURE__ */ jsx(Navigation, { size: 22, strokeWidth: 2 })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "trip-icon-btn",
            "aria-label": "Search reservations",
            "aria-expanded": searchOpen,
            onClick: () => setSearchOpen((v) => !v),
            children: /* @__PURE__ */ jsx(Search, { size: 24, strokeWidth: 2 })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: `trip-icon-btn trip-sound${soundOn ? " trip-sound-on" : " trip-sound-off"}`,
            "aria-label": soundOn ? "Mute new-reservation alert" : "Enable new-reservation alert",
            "aria-pressed": soundOn,
            onClick: () => setSoundOn((v) => !v),
            children: soundOn ? /* @__PURE__ */ jsx(Volume2, { size: 22, strokeWidth: 2 }) : /* @__PURE__ */ jsx(VolumeX, { size: 22, strokeWidth: 2 })
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "trip-icon-btn trip-bell",
            "aria-label": "Notifications",
            onClick: () => setNotesOpen(true),
            children: [
              /* @__PURE__ */ jsx(Bell, { size: 24, strokeWidth: 2 }),
              pendingNotes.length > 0 && /* @__PURE__ */ jsx("span", { className: "trip-bell-dot" })
            ]
          }
        )
      ] })
    ] }),
    searchOpen && /* @__PURE__ */ jsxs("div", { className: "trip-search", children: [
      /* @__PURE__ */ jsx(Search, { size: 18 }),
      /* @__PURE__ */ jsx(
        "input",
        {
          autoFocus: true,
          type: "search",
          value: search,
          placeholder: "Search name, flight, address, reference…",
          "aria-label": "Search reservations",
          onChange: (e) => setSearch(e.target.value)
        }
      ),
      search && /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Clear search", onClick: () => setSearch(""), children: /* @__PURE__ */ jsx(X, { size: 16 }) })
    ] }),
    panel === "trips" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "trip-sortbar", children: [
        /* @__PURE__ */ jsx("strong", { children: summary }),
        /* @__PURE__ */ jsxs("div", { style: { display: "inline-flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "trip-track-pill",
              style: { padding: "5px 12px", fontSize: 12 },
              onClick: () => {
                setFocusedFleetDriverId(void 0);
                setPanel("fleet");
              },
              title: "Open Driver View & Fleet Map",
              children: [
                /* @__PURE__ */ jsx(Compass, { size: 14 }),
                " Driver view"
              ]
            }
          ),
          /* @__PURE__ */ jsx("button", { type: "button", className: "trip-icon-btn", "aria-label": "Filter and sort", onClick: () => setFilterOpen(true), children: /* @__PURE__ */ jsx(Filter, { size: 24, strokeWidth: 2 }) })
        ] })
      ] }),
      businesses.length > 0 && /* @__PURE__ */ jsxs("div", { className: "trip-biz-selector", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "trip-biz-select",
            "aria-haspopup": "menu",
            "aria-expanded": bizMenuOpen,
            onClick: () => setBizMenuOpen((v) => !v),
            children: [
              /* @__PURE__ */ jsx(Building2, { size: 16 }),
              /* @__PURE__ */ jsx("span", { children: business === "all" ? "All businesses" : business }),
              /* @__PURE__ */ jsx(ChevronDown, { size: 16 })
            ]
          }
        ),
        bizMenuOpen && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "trip-scrim trip-scrim-soft", onClick: () => setBizMenuOpen(false) }),
          /* @__PURE__ */ jsxs("div", { className: "trip-biz-menu", role: "menu", "aria-label": "Select business", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                role: "menuitem",
                className: business === "all" ? "on" : "",
                onClick: () => {
                  setBusiness("all");
                  setSelectedBusinessId("");
                  setBizMenuOpen(false);
                },
                children: [
                  /* @__PURE__ */ jsx(Building2, { size: 15 }),
                  /* @__PURE__ */ jsx("span", { children: "All businesses" }),
                  /* @__PURE__ */ jsx("em", { children: all.length })
                ]
              }
            ),
            selectorBusinesses.map((b) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                role: "menuitem",
                className: business === b.name ? "on" : "",
                onClick: () => {
                  setBusiness(b.name);
                  setSelectedBusinessId(b.id);
                  setBizMenuOpen(false);
                },
                children: [
                  /* @__PURE__ */ jsx("span", { children: b.name.toUpperCase() === "ELITELIMOLINK" ? "Elite Limo Link" : b.name }),
                  /* @__PURE__ */ jsx("em", { children: b.count })
                ]
              },
              b.id
            )),
            /* @__PURE__ */ jsx("div", { className: "trip-biz-menu-divider" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                role: "menuitem",
                onClick: () => {
                  setManageOpen(true);
                  setBizMenuOpen(false);
                },
                children: [
                  /* @__PURE__ */ jsx(Settings2, { size: 15 }),
                  /* @__PURE__ */ jsx("span", { children: "Manage businesses" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                role: "menuitem",
                onClick: () => {
                  setAddError("");
                  setAddSuccess("");
                  setAddLink("");
                  setAddLinkCopied(false);
                  setAddOpen(true);
                  setBizMenuOpen(false);
                },
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 15 }),
                  /* @__PURE__ */ jsx("span", { children: "Add business" })
                ]
              }
            )
          ] })
        ] })
      ] }),
      business !== "all" && /* @__PURE__ */ jsxs("div", { className: "trip-business-active", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Showing reservations from ",
          /* @__PURE__ */ jsx("strong", { children: businessLabel })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "trip-text-btn", onClick: () => setBusiness("all"), children: "Show all businesses" })
      ] }),
      loading ? /* @__PURE__ */ jsxs("div", { className: "trip-empty", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "spin", size: 22 }),
        " Loading trips…"
      ] }) : error ? /* @__PURE__ */ jsx("div", { className: "trip-empty trip-empty-error", children: error }) : groups.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "trip-empty", children: [
        /* @__PURE__ */ jsx(Inbox, { size: 28 }),
        /* @__PURE__ */ jsx("p", { children: all.length === 0 ? "No reservations yet. New bookings will show up here." : "No trips match this view." }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "trip-text-btn", onClick: () => {
          setRange("all");
          setStatus("all");
          setSearch("");
        }, children: "Show all dates" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "trip-feed", children: groups.map((group) => /* @__PURE__ */ jsxs("section", { className: "trip-day", children: [
        /* @__PURE__ */ jsx("h2", { children: group.label }),
        /* @__PURE__ */ jsx("ul", { children: group.rows.map((r) => {
          const st = normalizeStatus(r.status);
          const round = Boolean(r.returnAt || r.returnLocal);
          const airportLine = r.flight ? r.flight : looksAirport(r.pickup) ? r.pickup : "";
          return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("article", { className: "trip-card", children: [
            /* @__PURE__ */ jsxs("button", { type: "button", className: "trip-card-main", onClick: () => setSelectedId(r.id), children: [
              /* @__PURE__ */ jsxs("div", { className: "trip-card-copy", children: [
                /* @__PURE__ */ jsxs("p", { className: "trip-card-name", children: [
                  r.name || "Unnamed guest",
                  " ",
                  /* @__PURE__ */ jsx("span", { children: shortRef(r.id) })
                ] }),
                r.sourceName && /* @__PURE__ */ jsx("p", { className: "trip-card-source", children: r.sourceName }),
                (r.paid || r.carSeat || r.insidePickup) && /* @__PURE__ */ jsxs("p", { className: "trip-card-meta", children: [
                  r.paid && /* @__PURE__ */ jsx(CreditCard, { size: 16, "aria-label": r.captured ? "Captured" : "Authorized" }),
                  r.paid && /* @__PURE__ */ jsx("span", { children: r.captured ? "Captured" : "Authorized" }),
                  r.paid && (round || r.service === "hourly" || r.carSeat || r.insidePickup) && /* @__PURE__ */ jsx("span", { className: "trip-dot", children: "•" }),
                  round && /* @__PURE__ */ jsx(RefreshCw, { size: 15, "aria-hidden": true }),
                  round && /* @__PURE__ */ jsx("span", { children: "Round trip" }),
                  !round && r.service === "hourly" && /* @__PURE__ */ jsx("span", { children: "Hourly" }),
                  r.carSeat && /* @__PURE__ */ jsx(Baby, { size: 15, "aria-label": "Car seat" }),
                  r.carSeat && /* @__PURE__ */ jsx("span", { children: "Car seat" }),
                  r.insidePickup && /* @__PURE__ */ jsx(DoorOpen, { size: 15, "aria-label": "Inside pickup" }),
                  r.insidePickup && /* @__PURE__ */ jsx("span", { children: "Inside pickup" })
                ] }),
                airportLine ? /* @__PURE__ */ jsxs("p", { className: "trip-card-flight", children: [
                  /* @__PURE__ */ jsx(Plane, { size: 16 }),
                  /* @__PURE__ */ jsx("span", { children: airportLine })
                ] }) : r.pickup ? /* @__PURE__ */ jsxs("p", { className: "trip-card-route-line", children: [
                  /* @__PURE__ */ jsx("span", { className: "trip-route-dot trip-route-pickup" }),
                  /* @__PURE__ */ jsx("span", { children: r.pickup })
                ] }) : null,
                r.extraStop && /* @__PURE__ */ jsxs("p", { className: "trip-card-route-line", children: [
                  /* @__PURE__ */ jsx("span", { className: "trip-route-dot trip-route-stop" }),
                  /* @__PURE__ */ jsx("span", { children: r.extraStop })
                ] }),
                r.dropoff && /* @__PURE__ */ jsxs("p", { className: "trip-card-route-line", children: [
                  /* @__PURE__ */ jsx("span", { className: "trip-route-dot trip-route-drop" }),
                  /* @__PURE__ */ jsx("span", { children: r.dropoff })
                ] }),
                (r.vehicle || r.passengers > 0 || r.estimatedFareText || r.driver) && /* @__PURE__ */ jsxs("p", { className: "trip-card-details", children: [
                  r.vehicle && /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx(CarFront, { size: 14 }),
                    " ",
                    tierName(r.vehicle)
                  ] }),
                  r.passengers > 0 && /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx(Users, { size: 14 }),
                    " ",
                    r.passengers
                  ] }),
                  driverName(r.driver) && /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx(Users, { size: 14 }),
                    " ",
                    driverName(r.driver)
                  ] }),
                  r.driver && /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      className: "trip-track-pill",
                      onClick: (e) => {
                        e.stopPropagation();
                        setFocusedFleetDriverId(r.driver);
                        setPanel("fleet");
                      },
                      title: "Şoförü Canlı Haritada Gör (Drive View)",
                      children: [
                        /* @__PURE__ */ jsx(Compass, { size: 12 }),
                        " Harita & Drive View"
                      ]
                    }
                  ),
                  r.estimatedFareText && /* @__PURE__ */ jsx("span", { className: "trip-card-fare", children: r.estimatedFareText })
                ] })
              ] }),
              /* @__PURE__ */ jsx("time", { dateTime: r.pickupAt || void 0, children: clock(r.pickupAt) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "trip-status-row", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: `trip-status trip-status-confirmed${st === "confirmed" ? " on" : ""}`,
                  disabled: savingId === r.id,
                  onClick: () => void setTripStatus(r.id, "confirmed"),
                  children: "Confirmed"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "trip-dot", children: "•" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: `trip-status trip-status-pending${st === "pending" ? " on" : ""}`,
                  disabled: savingId === r.id,
                  onClick: () => void setTripStatus(r.id, "pending"),
                  children: "Pending"
                }
              ),
              st !== "confirmed" && st !== "pending" && /* @__PURE__ */ jsx("span", { className: `trip-status-extra status-${st === "no_show" ? "no-show" : st}`, children: st === "no_show" ? "No-show" : st[0].toUpperCase() + st.slice(1) })
            ] })
          ] }) }, r.id);
        }) })
      ] }, group.label)) })
    ] }) : panel === "fleet" ? /* @__PURE__ */ jsxs("div", { className: "trip-settings", children: [
      /* @__PURE__ */ jsxs("div", { className: "trip-settings-head", children: [
        /* @__PURE__ */ jsx("h2", { children: "Driver view · Live Fleet Tracking" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setPanel("trips"), children: "Back to trips" })
      ] }),
      /* @__PURE__ */ jsx(
        FleetMap,
        {
          initialFocusedDriverId: focusedFleetDriverId,
          onClose: () => setPanel("trips")
        }
      )
    ] }) : panel === "activity" ? /* @__PURE__ */ jsxs("div", { className: "trip-settings", children: [
      /* @__PURE__ */ jsxs("div", { className: "trip-settings-head", children: [
        /* @__PURE__ */ jsx("h2", { children: "Live activity" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setPanel("trips"), children: "Back to trips" })
      ] }),
      /* @__PURE__ */ jsx(ActivityStream, { reservations: all })
    ] }) : panel === "drivers" ? /* @__PURE__ */ jsxs("div", { className: "trip-settings", children: [
      /* @__PURE__ */ jsxs("div", { className: "trip-settings-head", children: [
        /* @__PURE__ */ jsx("h2", { children: "Drivers" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setPanel("trips"), children: "Back to trips" })
      ] }),
      /* @__PURE__ */ jsx(DriversPanel, {})
    ] }) : /* @__PURE__ */ jsxs("div", { className: "trip-settings", children: [
      /* @__PURE__ */ jsxs("div", { className: "trip-settings-head", children: [
        /* @__PURE__ */ jsxs("h2", { children: [
          "Settings",
          settingsBusinessLabel ? ` · ${settingsBusinessLabel}` : ""
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setPanel("trips"), children: "Back to trips" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dashboard-grid", children: [
        /* @__PURE__ */ jsx(
          PricingPanel,
          {
            businessId: effectiveBusinessId,
            businessLabel: settingsBusinessLabel,
            onSaved: onSettingsSaved
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "dashboard-side", children: [
          /* @__PURE__ */ jsx(BookingLinkCard, { businessId: effectiveBusinessId }),
          /* @__PURE__ */ jsx(MapsStatusCard, {}),
          /* @__PURE__ */ jsx(PaymentStatusCard, {})
        ] })
      ] }),
      /* @__PURE__ */ jsx(VehicleTiersPanel, { businessId: effectiveBusinessId, businessLabel: settingsBusinessLabel })
    ] }),
    menuOpen && /* @__PURE__ */ jsx("div", { className: "trip-scrim", onClick: () => setMenuOpen(false), children: /* @__PURE__ */ jsxs("nav", { className: "trip-drawer", onClick: (e) => e.stopPropagation(), "aria-label": "Dashboard menu", children: [
      /* @__PURE__ */ jsxs("div", { className: "trip-drawer-head", children: [
        /* @__PURE__ */ jsx("strong", { children: "Menu" }),
        /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Close menu", onClick: () => setMenuOpen(false), children: /* @__PURE__ */ jsx(X, { size: 20 }) })
      ] }),
      email && /* @__PURE__ */ jsx("p", { className: "trip-drawer-email", children: email }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
        setPanel("trips");
        setMenuOpen(false);
      }, children: "Reservations" }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
        setFocusedFleetDriverId(void 0);
        setPanel("fleet");
        setMenuOpen(false);
      }, children: "Driver view" }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
        setPanel("activity");
        setMenuOpen(false);
      }, children: "Live activity" }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
        setPanel("settings");
        setMenuOpen(false);
      }, children: "Pricing & settings" }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
        setManageOpen(true);
        setMenuOpen(false);
      }, children: "Manage businesses" }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
        setPanel("drivers");
        setMenuOpen(false);
      }, children: "Drivers" }),
      /* @__PURE__ */ jsx(Link, { to: "/dispatch", onClick: () => setMenuOpen(false), children: "Dispatch center" }),
      /* @__PURE__ */ jsx(Link, { to: "/driver", onClick: () => setMenuOpen(false), children: "Driver portal" }),
      /* @__PURE__ */ jsx(Link, { to: "/", onClick: () => setMenuOpen(false), children: "Elite Limo Link" }),
      businesses.filter((b) => b.businessName && !b.businessName.toLowerCase().includes("elitelimolink") && b.id !== userId).map((b) => /* @__PURE__ */ jsx(Link, { to: getBizLink(b, false), onClick: () => setMenuOpen(false), children: b.businessName }, b.id)),
      /* @__PURE__ */ jsx("button", { type: "button", className: "trip-signout", onClick: signOut, children: "Sign out" })
    ] }) }),
    notesOpen && /* @__PURE__ */ jsx("div", { className: "trip-scrim", onClick: () => setNotesOpen(false), children: /* @__PURE__ */ jsxs("aside", { className: "trip-sheet", onClick: (e) => e.stopPropagation(), "aria-label": "Notifications", children: [
      /* @__PURE__ */ jsxs("div", { className: "trip-drawer-head", children: [
        /* @__PURE__ */ jsx("strong", { children: "Needs attention" }),
        /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Close notifications", onClick: () => setNotesOpen(false), children: /* @__PURE__ */ jsx(X, { size: 20 }) })
      ] }),
      pendingNotes.length === 0 ? /* @__PURE__ */ jsx("p", { className: "trip-sheet-empty", children: "No pending reservations." }) : /* @__PURE__ */ jsx("ul", { className: "trip-note-list", children: pendingNotes.map((r) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => {
            setNotesOpen(false);
            setPanel("trips");
            setSelectedId(r.id);
          },
          children: [
            /* @__PURE__ */ jsx("strong", { children: r.name || "Unnamed guest" }),
            /* @__PURE__ */ jsxs("span", { children: [
              r.pickupLocal || "Pickup time to confirm",
              " · ",
              shortRef(r.id)
            ] })
          ]
        }
      ) }, r.id)) })
    ] }) }),
    filterOpen && /* @__PURE__ */ jsx("div", { className: "trip-scrim", onClick: () => setFilterOpen(false), children: /* @__PURE__ */ jsxs("aside", { className: "trip-sheet", onClick: (e) => e.stopPropagation(), "aria-label": "Filter reservations", children: [
      /* @__PURE__ */ jsxs("div", { className: "trip-drawer-head", children: [
        /* @__PURE__ */ jsx("strong", { children: "Filter" }),
        /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Close filters", onClick: () => setFilterOpen(false), children: /* @__PURE__ */ jsx(X, { size: 20 }) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "trip-sheet-label", children: "Date window" }),
      /* @__PURE__ */ jsx("div", { className: "trip-chip-row", children: Object.keys(RANGE_LABEL).map((id) => /* @__PURE__ */ jsx("button", { type: "button", className: range === id ? "on" : "", onClick: () => setRange(id), children: RANGE_LABEL[id] }, id)) }),
      /* @__PURE__ */ jsx("p", { className: "trip-sheet-label", children: "Order" }),
      /* @__PURE__ */ jsxs("div", { className: "trip-chip-row", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: order === "oldest" ? "on" : "", onClick: () => setOrder("oldest"), children: "Oldest trip date first" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: order === "newest" ? "on" : "", onClick: () => setOrder("newest"), children: "Newest trip date first" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "trip-sheet-label", children: "Status" }),
      /* @__PURE__ */ jsx("div", { className: "trip-chip-row", children: STATUS_FILTERS.map((f) => /* @__PURE__ */ jsx("button", { type: "button", className: status === f.id ? "on" : "", onClick: () => setStatus(f.id), children: f.label }, f.id)) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "trip-apply", onClick: () => setFilterOpen(false), children: "Show trips" })
    ] }) }),
    addOpen && /* @__PURE__ */ jsx("div", { className: "trip-scrim", onClick: () => setAddOpen(false), children: /* @__PURE__ */ jsxs("aside", { className: "trip-sheet trip-sheet-form", onClick: (e) => e.stopPropagation(), "aria-label": "Add a business", children: [
      /* @__PURE__ */ jsxs("div", { className: "trip-drawer-head", children: [
        /* @__PURE__ */ jsx("strong", { children: "Add a business" }),
        /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Close", onClick: () => setAddOpen(false), children: /* @__PURE__ */ jsx(X, { size: 20 }) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "trip-sheet-label", children: "Business name" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "trip-input",
          value: addForm.businessName,
          onChange: (e) => setAddForm({ businessName: e.target.value }),
          placeholder: "e.g. City Limo Service"
        }
      ),
      addError && /* @__PURE__ */ jsx("p", { className: "trip-form-error", children: addError }),
      addSuccess && addLink && /* @__PURE__ */ jsxs("div", { className: "trip-link-success", children: [
        /* @__PURE__ */ jsx("p", { className: "trip-form-success", children: addSuccess }),
        /* @__PURE__ */ jsx("span", { className: "trip-link-label", children: "Dedicated booking link" }),
        /* @__PURE__ */ jsxs("div", { className: "trip-link-row", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              className: "trip-input",
              readOnly: true,
              value: addLink,
              onFocus: (e) => e.currentTarget.select(),
              "aria-label": "Generated booking link"
            }
          ),
          /* @__PURE__ */ jsxs("button", { type: "button", className: "trip-link-copy", onClick: () => void copyAddLink(), children: [
            addLinkCopied ? /* @__PURE__ */ jsx(Check, { size: 15 }) : /* @__PURE__ */ jsx(Copy, { size: 15 }),
            " ",
            addLinkCopied ? "Copied" : "Copy"
          ] }),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: addLink,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "trip-link-open",
              "aria-label": "Open the new business booking page",
              children: [
                /* @__PURE__ */ jsx(ExternalLink, { size: 15 }),
                " Open"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "trip-form-hint", children: "The new business is linked to your account automatically. It gets its own settings, vehicle tiers, and a unique booking link, and new reservations route to this central dashboard." }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "trip-apply", disabled: adding, onClick: () => void submitBusiness(), children: adding ? "Creating…" : "Create business" })
    ] }) }),
    manageOpen && /* @__PURE__ */ jsx("div", { className: "trip-scrim", onClick: () => setManageOpen(false), children: /* @__PURE__ */ jsxs("aside", { className: "trip-sheet trip-sheet-form trip-manage-sheet", onClick: (e) => e.stopPropagation(), "aria-label": "Manage businesses", children: [
      /* @__PURE__ */ jsxs("div", { className: "trip-drawer-head", children: [
        /* @__PURE__ */ jsx("strong", { children: "Manage businesses" }),
        /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Close", onClick: () => setManageOpen(false), children: /* @__PURE__ */ jsx(X, { size: 20 }) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "trip-manage-hint", children: "Each business has its own dedicated booking link tied to its settings, vehicle categories, and reservations. Copy or open a link to share that business's booking page." }),
      /* @__PURE__ */ jsx("ul", { className: "trip-manage-list", children: businesses.map((b) => {
        const isOwn = b.id === userId;
        const rawName = (b.businessName || "").trim();
        const displayName = rawName.toUpperCase() === "ELITELIMOLINK" ? "Elite Limo Link" : rawName || b.email || "Unnamed business";
        const link = getBizLink(b, isOwn);
        return /* @__PURE__ */ jsxs(
          "li",
          {
            onContextMenu: isOwn ? void 0 : (e) => {
              e.preventDefault();
              openBizContextMenu(b.id, displayName, e.clientX, e.clientY);
            },
            children: [
              /* @__PURE__ */ jsxs("div", { className: "trip-manage-row", children: [
                /* @__PURE__ */ jsxs("div", { className: "trip-manage-copy", children: [
                  /* @__PURE__ */ jsx("span", { className: "trip-manage-name-label", children: "Registered name" }),
                  /* @__PURE__ */ jsx("strong", { children: displayName }),
                  isOwn ? /* @__PURE__ */ jsx("span", { className: "trip-manage-tag", children: "Primary" }) : /* @__PURE__ */ jsx("span", { children: b.email })
                ] }),
                !isOwn && /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "trip-manage-more",
                    "aria-label": `Options for ${displayName}`,
                    onClick: (e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      openBizContextMenu(b.id, displayName, rect.right - 180, rect.bottom + 6);
                    },
                    children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 })
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("span", { className: "trip-link-label", children: "Dedicated booking link" }),
              /* @__PURE__ */ jsxs("div", { className: "trip-link-row", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    className: "trip-input",
                    readOnly: true,
                    value: link,
                    onFocus: (e) => e.currentTarget.select(),
                    "aria-label": `${displayName} booking link`
                  }
                ),
                /* @__PURE__ */ jsxs("button", { type: "button", className: "trip-link-copy", onClick: () => copyBizLink(link, b.id), children: [
                  copiedBizId === b.id ? /* @__PURE__ */ jsx(Check, { size: 15 }) : /* @__PURE__ */ jsx(Copy, { size: 15 }),
                  " ",
                  copiedBizId === b.id ? "Copied" : "Copy"
                ] }),
                /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: link,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "trip-link-open",
                    "aria-label": `Open ${displayName} booking page`,
                    children: [
                      /* @__PURE__ */ jsx(ExternalLink, { size: 15 }),
                      " Open"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "trip-link-caption", children: [
                "Opens the booking flow for ",
                /* @__PURE__ */ jsx("strong", { children: displayName }),
                " using its own rates and vehicle categories."
              ] })
            ]
          },
          b.id
        );
      }) }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "trip-apply",
          onClick: () => {
            setManageOpen(false);
            setAddError("");
            setAddSuccess("");
            setAddLink("");
            setAddLinkCopied(false);
            setAddOpen(true);
          },
          children: [
            /* @__PURE__ */ jsx(Plus, { size: 16 }),
            " Add business"
          ]
        }
      )
    ] }) }),
    contextMenu && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "trip-scrim trip-scrim-soft",
          onClick: () => setContextMenu(null),
          onContextMenu: (e) => {
            e.preventDefault();
            setContextMenu(null);
          }
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "trip-context-menu",
          style: { top: contextMenu.y, left: contextMenu.x },
          role: "menu",
          "aria-label": `Options for ${contextMenu.name}`,
          children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              role: "menuitem",
              onClick: () => {
                setDeleteTarget({ id: contextMenu.id, name: contextMenu.name });
                setDeleteError("");
                setContextMenu(null);
              },
              children: [
                /* @__PURE__ */ jsx(Trash2, { size: 15 }),
                " Delete business"
              ]
            }
          )
        }
      )
    ] }),
    deleteTarget && /* @__PURE__ */ jsx("div", { className: "trip-scrim", onClick: () => !deleting && setDeleteTarget(null), children: /* @__PURE__ */ jsxs("div", { className: "trip-confirm-dialog", onClick: (e) => e.stopPropagation(), role: "dialog", "aria-label": "Delete business", children: [
      /* @__PURE__ */ jsx("div", { className: "trip-confirm-icon", children: /* @__PURE__ */ jsx(Trash2, { size: 22 }) }),
      /* @__PURE__ */ jsxs("h3", { children: [
        "Delete ",
        deleteTarget.name,
        "?"
      ] }),
      /* @__PURE__ */ jsx("p", { children: "This removes the business’s active booking access and its settings and vehicle categories. Historical reservations are preserved in your dashboard with their original business label." }),
      deleteError && /* @__PURE__ */ jsx("p", { className: "trip-form-error", children: deleteError }),
      /* @__PURE__ */ jsxs("div", { className: "confirm-delete-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "ghost-button", disabled: deleting, onClick: () => setDeleteTarget(null), children: "Cancel" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "danger-button", disabled: deleting, onClick: () => void confirmDeleteBusiness(), children: deleting ? "Deleting…" : "Delete" })
      ] })
    ] }) }),
    selected && /* @__PURE__ */ jsx(
      ReservationEditor,
      {
        reservation: selected,
        onClose: () => setSelectedId(null),
        onSaved: (next) => {
          setAll((prev) => prev.map((r) => r.id === next.id ? next : r));
          setSelectedId(null);
        },
        onDeleted: (id) => {
          setAll((prev) => prev.filter((r) => r.id !== id));
          setSelectedId(null);
        }
      }
    )
  ] });
}
function meta$3({
  matches,
  location
}) {
  return seo({
    matches,
    location
  }, {
    title: "Dashboard | ELITELIMOLINK",
    description: "Upcoming reservations grouped by trip date, with status, search, and operator settings.",
    noindex: true
  });
}
function clientLoader$1() {
  return {
    user: requireAuth()
  };
}
clientLoader$1.hydrate = true;
const HydrateFallback$1 = UNSAFE_withHydrateFallbackProps(function HydrateFallback4() {
  return /* @__PURE__ */ jsx("div", {
    className: "dashboard-loading"
  });
});
const dashboard = UNSAFE_withComponentProps(function DashboardPage({
  loaderData
}) {
  return /* @__PURE__ */ jsx("main", {
    children: /* @__PURE__ */ jsx(TripBoard, {
      email: loaderData.user?.email,
      userId: loaderData.user?.id ?? ""
    })
  });
});
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  HydrateFallback: HydrateFallback$1,
  clientLoader: clientLoader$1,
  default: dashboard,
  meta: meta$3
}, Symbol.toStringTag, { value: "Module" }));
const SORT_LABELS = {
  created: "Newest request",
  pickup: "Upcoming pickup"
};
const matchesSearch = (r, q) => {
  if (!q) return true;
  const hay = `${r.name} ${r.email} ${r.phone} ${r.pickup} ${r.dropoff} ${r.sourceName} ${r.id} RB-${r.id.slice(-8).toUpperCase()}`.toLowerCase();
  return hay.includes(q.toLowerCase());
};
function DispatchCenter() {
  const tierName = useVehicleTierName();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("pickup");
  const [selectedId, setSelectedId] = useState(null);
  const [livePulse, setLivePulse] = useState(false);
  const [flashId, setFlashId] = useState(null);
  const reconcileTimer = useRef(null);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const records = await pocketbaseClient.collection("reservations").getFullList({
        sort: "-created",
        requestKey: null
      });
      setAll(records);
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError("Couldn’t load reservations. Please sign in again.");
    } finally {
      setLoading(false);
    }
  }
  async function refresh() {
    try {
      const records = await pocketbaseClient.collection("reservations").getFullList({
        sort: "-created",
        requestKey: null
      });
      setAll(records);
    } catch (err) {
      if (handlePbAuthError(err)) return;
    }
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const onPageShow = (e) => {
      if (e.persisted || document.visibilityState === "visible") refresh();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const timer = window.setInterval(tick, 1e4);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    void pocketbaseClient.collection("reservations").subscribe("*", (e) => {
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 1200);
      if (e.action === "create") {
        setFlashId(e.record.id);
        setTimeout(() => setFlashId((cur) => cur === e.record.id ? null : cur), 2600);
      }
      setAll((prev) => {
        if (e.action === "delete") return prev.filter((r) => r.id !== e.record.id);
        const next = e.record;
        const exists = prev.some((r) => r.id === next.id);
        return exists ? prev.map((r) => r.id === next.id ? next : r) : [next, ...prev];
      });
      if (reconcileTimer.current) window.clearTimeout(reconcileTimer.current);
      reconcileTimer.current = window.setTimeout(() => {
        void refresh();
      }, 2500);
    }).catch((err) => console.error("Realtime subscription failed", err));
    return () => {
      if (reconcileTimer.current) window.clearTimeout(reconcileTimer.current);
      void pocketbaseClient.collection("reservations").unsubscribe("*").catch(() => {
      });
    };
  }, []);
  const counts = useMemo(() => {
    const base = { all: all.length };
    RESERVATION_STATUSES.forEach((s) => {
      base[s] = all.filter((r) => normalizeStatus(r.status) === s).length;
    });
    return base;
  }, [all]);
  const visible = useMemo(() => {
    const q = search.trim();
    const list = all.filter((r) => filter === "all" ? true : normalizeStatus(r.status) === filter).filter((r) => matchesSearch(r, q));
    if (sort === "pickup") {
      return [...list].sort(compareByPickup);
    }
    return list;
  }, [all, filter, search, sort]);
  const selected = selectedId ? all.find((r) => r.id === selectedId) ?? null : null;
  return /* @__PURE__ */ jsxs("section", { className: "dispatch-shell", children: [
    /* @__PURE__ */ jsxs("div", { className: "dispatch-controls", children: [
      /* @__PURE__ */ jsxs("div", { className: "search-field", children: [
        /* @__PURE__ */ jsx(Search, { size: 17 }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "search",
            placeholder: "Search name, address, email, phone, reference…",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            "aria-label": "Search reservations"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "refresh-button", onClick: load, "aria-label": "Refresh reservations", children: [
        /* @__PURE__ */ jsx(RefreshCw, { size: 16 }),
        " Refresh"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "sort-row", role: "group", "aria-label": "Sort reservations", children: [
      /* @__PURE__ */ jsx("span", { className: "sort-label", children: "Sort by" }),
      Object.keys(SORT_LABELS).map((id) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `sort-chip${sort === id ? " active" : ""}`,
          "aria-pressed": sort === id,
          onClick: () => setSort(id),
          children: SORT_LABELS[id]
        },
        id
      ))
    ] }),
    /* @__PURE__ */ jsx("div", { className: "status-filters", role: "tablist", "aria-label": "Filter by status", children: STATUS_FILTERS.map((f) => {
      const count = counts[f.id] ?? 0;
      const active = filter === f.id;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          role: "tab",
          "aria-selected": active,
          className: `status-filter${active ? " active" : ""}`,
          onClick: () => setFilter(f.id),
          children: [
            /* @__PURE__ */ jsx("span", { children: f.label }),
            /* @__PURE__ */ jsx("em", { children: count })
          ]
        },
        f.id
      );
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "dispatch-live", children: [
      /* @__PURE__ */ jsx("span", { className: `live-dot${livePulse ? " pulse" : ""}` }),
      /* @__PURE__ */ jsxs("span", { children: [
        "Realtime · ",
        all.length,
        " total reservation",
        all.length === 1 ? "" : "s"
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsxs("div", { className: "dispatch-loading", children: [
      /* @__PURE__ */ jsx(Loader2, { size: 22 }),
      " Loading reservations…"
    ] }) : error ? /* @__PURE__ */ jsx("div", { className: "dispatch-error", children: error }) : visible.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "dispatch-empty", children: [
      /* @__PURE__ */ jsx(Inbox, { size: 30 }),
      /* @__PURE__ */ jsx("p", { children: all.length === 0 ? "No reservations yet. New booking requests will appear here in real time." : "No reservations match your search or filter." })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "dispatch-table", role: "list", children: [
      /* @__PURE__ */ jsxs("div", { className: "dispatch-row dispatch-row-head", children: [
        /* @__PURE__ */ jsx("span", { children: "Passenger" }),
        /* @__PURE__ */ jsx("span", { children: "Route" }),
        /* @__PURE__ */ jsx("span", { children: "Pickup" }),
        /* @__PURE__ */ jsx("span", { children: "Vehicle" }),
        /* @__PURE__ */ jsx("span", { children: "Fare" }),
        /* @__PURE__ */ jsx("span", { children: "Status" })
      ] }),
      visible.map((r) => {
        const status = normalizeStatus(r.status);
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            role: "listitem",
            className: `dispatch-row${selectedId === r.id ? " selected" : ""}${flashId === r.id ? " flash" : ""}`,
            onClick: () => setSelectedId(r.id),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "dr-passenger", children: [
                /* @__PURE__ */ jsx("strong", { children: r.name || "—" }),
                /* @__PURE__ */ jsxs("span", { className: "dr-ref", children: [
                  "RB-",
                  r.id.slice(-8).toUpperCase()
                ] }),
                r.sourceName && /* @__PURE__ */ jsx("span", { className: "dr-source", children: r.sourceName }),
                r.paid && /* @__PURE__ */ jsx("span", { className: "paid-badge", children: r.captured ? "Captured" : "Authorized" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "dr-route", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx(MapPin, { size: 13 }),
                  " ",
                  r.pickup || "—"
                ] }),
                r.extraStop && /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("span", { className: "stop-marker", style: { width: 11, height: 11, borderWidth: 2 } }),
                  " ",
                  r.extraStop
                ] }),
                r.dropoff && /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("span", { className: "dropoff-marker mini" }),
                  " ",
                  r.dropoff
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "dr-pickup", children: [
                /* @__PURE__ */ jsx(CalendarDays, { size: 13 }),
                /* @__PURE__ */ jsx("span", { children: r.pickupLocal || "—" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "dr-vehicle", children: [
                /* @__PURE__ */ jsx(CarFront, { size: 14 }),
                /* @__PURE__ */ jsx("span", { children: tierName(r.vehicle) }),
                /* @__PURE__ */ jsxs("em", { children: [
                  /* @__PURE__ */ jsx(Users, { size: 11 }),
                  " ",
                  r.passengers
                ] }),
                r.carSeat && /* @__PURE__ */ jsxs("em", { className: "dr-addon", children: [
                  /* @__PURE__ */ jsx(Baby, { size: 11 }),
                  " Seat"
                ] }),
                r.insidePickup && /* @__PURE__ */ jsxs("em", { className: "dr-addon", children: [
                  /* @__PURE__ */ jsx(DoorOpen, { size: 11 }),
                  " Inside"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "dr-fare", children: [
                /* @__PURE__ */ jsx("strong", { children: r.estimatedFareText || "To quote" }),
                r.distanceMiles ? /* @__PURE__ */ jsxs("small", { children: [
                  Number(r.distanceMiles).toFixed(1),
                  " mi"
                ] }) : null
              ] }),
              /* @__PURE__ */ jsx("div", { className: "dr-status", children: /* @__PURE__ */ jsx(StatusBadge, { value: status, size: "sm" }) })
            ]
          },
          r.id
        );
      })
    ] }),
    selected && /* @__PURE__ */ jsx(
      ReservationEditor,
      {
        reservation: selected,
        onClose: () => setSelectedId(null),
        onSaved: (updated) => {
          setAll((prev) => prev.map((r) => r.id === updated.id ? updated : r));
        },
        onDeleted: (id) => {
          setAll((prev) => prev.filter((r) => r.id !== id));
          setSelectedId(null);
        }
      },
      selected.id
    )
  ] });
}
function meta$2({
  matches,
  location
}) {
  return seo({
    matches,
    location
  }, {
    title: "Dispatch Center | ELITELIMOLINK",
    description: "View, search, filter, and edit every reservation in real time. Manage booking statuses and update trip details from one dispatch board.",
    noindex: true
  });
}
function clientLoader() {
  return {
    user: requireAuth()
  };
}
clientLoader.hydrate = true;
const HydrateFallback5 = UNSAFE_withHydrateFallbackProps(function HydrateFallback6() {
  return /* @__PURE__ */ jsx("div", {
    className: "dashboard-loading"
  });
});
const dispatch = UNSAFE_withComponentProps(function DispatchPage({
  loaderData
}) {
  return /* @__PURE__ */ jsxs("main", {
    className: "dashboard-page",
    children: [/* @__PURE__ */ jsx("div", {
      className: "ambient ambient-one"
    }), /* @__PURE__ */ jsx("div", {
      className: "ambient ambient-two"
    }), /* @__PURE__ */ jsxs("header", {
      className: "dashboard-header",
      children: [/* @__PURE__ */ jsxs("a", {
        href: "/",
        className: "page-brand",
        style: {
          textDecoration: "none"
        },
        children: [/* @__PURE__ */ jsxs("span", {
          className: "brand-mark",
          children: ["B", /* @__PURE__ */ jsx("span", {
            children: "L"
          })]
        }), /* @__PURE__ */ jsxs("span", {
          className: "brand-word",
          children: ["ELITELIMOLINK", /* @__PURE__ */ jsx("span", {
            className: "brand-sub",
            children: " / DISPATCH"
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "dashboard-user",
        children: [/* @__PURE__ */ jsx("span", {
          children: loaderData.user?.email
        }), /* @__PURE__ */ jsx(ThemeToggle, {
          className: "theme-toggle compact"
        }), /* @__PURE__ */ jsx("a", {
          href: "/dashboard",
          className: "dashboard-link",
          children: "Settings"
        }), /* @__PURE__ */ jsx("a", {
          href: "/",
          className: "dashboard-link",
          children: "View site"
        })]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "dashboard-shell",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "dashboard-intro",
        children: [/* @__PURE__ */ jsx("span", {
          className: "eyebrow",
          children: "DISPATCH CENTER"
        }), /* @__PURE__ */ jsx("h1", {
          children: "Reservations, live"
        }), /* @__PURE__ */ jsx("p", {
          children: "Every booking appears here the moment a customer requests it. Search and filter by status, open any reservation to update trip details, change its status, or remove it — changes sync back to the customer confirmation and your records instantly."
        })]
      }), /* @__PURE__ */ jsx(DispatchCenter, {})]
    })]
  });
});
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  HydrateFallback: HydrateFallback5,
  clientLoader,
  default: dispatch,
  meta: meta$2
}, Symbol.toStringTag, { value: "Module" }));
const STATIC_PATHS = ["/"];
function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
function toLoc(origin, path) {
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
function serializeSitemap(origin, entries) {
  const urls = entries.map((entry2) => {
    const loc = escapeXml(toLoc(origin, entry2.path));
    const lastmod = entry2.lastmod ? `
		<lastmod>${escapeXml(entry2.lastmod)}</lastmod>` : "";
    return `	<url>
		<loc>${loc}</loc>${lastmod}
	</url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
async function getDynamicEntries() {
  return [];
}
async function loader$e({
  request
}) {
  const origin = siteOrigin(request);
  const entries = [...STATIC_PATHS.map((path) => ({
    path
  })), ...await getDynamicEntries()];
  return new Response(serializeSitemap(origin, entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$e
}, Symbol.toStringTag, { value: "Module" }));
const UNPUBLISHED_HOST_SUFFIXES = [".app-preview.com", ".app-preview.io", ".hostingersite.com", ".hostingersite.dev"];
const AI_ANSWER_AGENTS = ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "DuckAssistBot", "MistralAI-User", "meta-webindexer", "meta-externalfetcher", "Amzn-SearchBot", "Amzn-User"];
const AI_TRAINING_AGENTS = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "meta-externalagent", "Amazonbot", "Bytespider"];
const CONTENT_SIGNAL = "Content-Signal: search=yes, ai-input=yes, ai-train=no";
function publishedRules(origin) {
  return ["User-agent: *", CONTENT_SIGNAL, "Allow: /", "", ...AI_ANSWER_AGENTS.flatMap((agent) => [`User-agent: ${agent}`, CONTENT_SIGNAL, "Allow: /", ""]), ...AI_TRAINING_AGENTS.flatMap((agent) => [`User-agent: ${agent}`, "Disallow: /", ""]), `Sitemap: ${origin}/sitemap.xml`];
}
function loader$d({
  request
}) {
  const origin = siteOrigin(request);
  const {
    hostname
  } = new URL(origin);
  const isUnpublished = UNPUBLISHED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
  const lines = isUnpublished ? ["User-agent: *", "Disallow: /"] : publishedRules(origin);
  return new Response(`${lines.join("\n")}
`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$d
}, Symbol.toStringTag, { value: "Module" }));
const MS_PER_SECOND = 1e3;
const WINDOW_SECONDS = 5 * 60;
const MAX_REQUESTS_PER_WINDOW = 100;
const IPV6_PREFIX_BYTES = 7;
const clientIdentifier = (request) => {
  const [forwarded] = request.headers.get("x-forwarded-for")?.split(",") ?? [];
  const address = forwarded?.trim() || request.headers.get("x-real-ip")?.trim();
  if (!address) {
    return "unknown";
  }
  try {
    const parsed = ipaddr.parse(address);
    if (!(parsed instanceof ipaddr.IPv6)) {
      return address;
    }
    if (parsed.isIPv4MappedAddress()) {
      return parsed.toIPv4Address().toString();
    }
    return parsed.toByteArray().slice(0, IPV6_PREFIX_BYTES).join(".");
  } catch {
    return address;
  }
};
const sharedLimiter = new RateLimiterMemory({
  points: MAX_REQUESTS_PER_WINDOW,
  duration: WINDOW_SECONDS
});
const consume = async (limiter, identifier) => {
  try {
    return { result: await limiter.consume(identifier), isLimited: false };
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      return { result: error, isLimited: true };
    }
    throw error;
  }
};
const consumeRateLimit = async (identifier) => {
  const { result, isLimited } = await consume(sharedLimiter, identifier);
  return {
    isLimited,
    limit: MAX_REQUESTS_PER_WINDOW,
    remaining: result.remainingPoints,
    resetSeconds: Math.max(0, Math.ceil(result.msBeforeNext / MS_PER_SECOND))
  };
};
const rateLimitHeaders = (verdict) => {
  const headers2 = {
    "RateLimit-Policy": `${verdict.limit};w=${WINDOW_SECONDS}`,
    "RateLimit-Limit": String(verdict.limit),
    "RateLimit-Remaining": String(verdict.remaining),
    "RateLimit-Reset": String(verdict.resetSeconds)
  };
  if (verdict.isLimited) {
    headers2["Retry-After"] = String(verdict.resetSeconds);
  }
  return headers2;
};
const BODY_LIMIT_BYTES = 20 * 1024 * 1024;
const SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Permitted-Cross-Domain-Policies": "none"
};
const withExtraHeaders = (response, extra) => {
  const headers2 = new Headers(response.headers);
  for (const [name, value] of Object.entries(extra)) {
    if (!headers2.has(name)) {
      headers2.set(name, value);
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers2
  });
};
const json = (value, init = {}) => withExtraHeaders(Response.json(value, init), SECURITY_HEADERS);
const apiError = (status, message) => json({ error: message }, { status });
const serverError = (error) => {
  const isProduction = process.env.NODE_ENV === "production";
  const cause = error instanceof Error ? error : new Error(String(error));
  return json(
    {
      message: "Something went wrong!",
      ...!isProduction && {
        error: {
          name: cause.name,
          message: cause.message,
          stack: cause.stack
        }
      }
    },
    { status: 500 }
  );
};
const runHandler = async (handler, args) => {
  const verdict = await consumeRateLimit(clientIdentifier(args.request));
  if (verdict.isLimited) {
    return withExtraHeaders(apiError(429, "Too many requests, please try again later"), rateLimitHeaders(verdict));
  }
  const extraHeaders = rateLimitHeaders(verdict);
  try {
    const result = await handler(args);
    const response = result instanceof Response ? withExtraHeaders(result, SECURITY_HEADERS) : json(result ?? null);
    return withExtraHeaders(response, extraHeaders);
  } catch (error) {
    if (error instanceof Response) {
      return withExtraHeaders(error, extraHeaders);
    }
    logger.error(error instanceof Error ? error.message : error, error instanceof Error ? error.stack : void 0);
    return withExtraHeaders(serverError(error), extraHeaders);
  }
};
const withApi = (handler) => {
  return async (args) => {
    const startedAt = Date.now();
    const response = await runHandler(handler, args);
    const { pathname } = new URL(args.request.url);
    logger.info(`${args.request.method} ${pathname} ${response.status} ${Date.now() - startedAt}ms`);
    return response;
  };
};
const readBodyWithinLimit = async (request) => {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > BODY_LIMIT_BYTES) {
    throw apiError(413, "Request body too large");
  }
  if (!request.body) {
    return Buffer.alloc(0);
  }
  const reader = request.body.getReader();
  const chunks = [];
  let receivedBytes = 0;
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }
      receivedBytes += value.byteLength;
      if (receivedBytes > BODY_LIMIT_BYTES) {
        await reader.cancel();
        throw apiError(413, "Request body too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
};
const readJsonBody = async (request) => {
  const body = (await readBodyWithinLimit(request)).toString("utf8");
  try {
    return JSON.parse(body);
  } catch {
    throw apiError(400, "Invalid JSON body");
  }
};
const readFormData = async (request) => {
  const body = await readBodyWithinLimit(request);
  const contentType = request.headers.get("content-type");
  return new Response(new Uint8Array(body), {
    ...contentType && { headers: { "content-type": contentType } }
  }).formData();
};
const loader$c = withApi(async () => json({
  ok: true
}));
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$c
}, Symbol.toStringTag, { value: "Module" }));
const SERVICE_STATES = ["NY", "NJ", "CT"];
const SERVICE_STATE_SET = new Set(SERVICE_STATES.map((s) => s.toLowerCase()));
const STATE_NAME_TO_ABBR = {
  "new york": "ny",
  "new jersey": "nj",
  connecticut: "ct"
};
function serviceStateAbbr(value) {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (!v) return null;
  if (SERVICE_STATE_SET.has(v)) return v;
  return STATE_NAME_TO_ABBR[v] ?? null;
}
function isServiceState(abbr) {
  return serviceStateAbbr(abbr) !== null;
}
function serviceStateFromText(text) {
  for (const part of text.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const first = serviceStateAbbr(trimmed.split(/\s+/)[0]);
    if (first) return first;
    const full = serviceStateAbbr(trimmed);
    if (full) return full;
  }
  return null;
}
function textInServiceArea(text) {
  return serviceStateFromText(text) !== null;
}
const SERVICE_AREA_AIRPORT_CODES = /* @__PURE__ */ new Set([
  "JFK",
  "LGA",
  "EWR",
  // major NYC-area gateways
  "HPN",
  "ISP",
  "FRG",
  "SWF",
  // New York regionals
  "TEB",
  "MMU",
  "CDW",
  // New Jersey regionals
  "BDL",
  "HVN",
  "OXC",
  "GON",
  "DXR",
  // Connecticut regionals
  "ALB",
  "BUF",
  "ROC",
  "SYR",
  "ITH"
  // upstate New York
]);
const airports = [
  { code: "JFK", name: "John F. Kennedy Intl", city: "New York", country: "USA", lat: 40.6413, lng: -73.7781 },
  { code: "LGA", name: "LaGuardia", city: "New York", country: "USA", lat: 40.7769, lng: -73.874 },
  { code: "EWR", name: "Newark Liberty Intl", city: "Newark", country: "USA", lat: 40.6895, lng: -74.1745 },
  { code: "HPN", name: "Westchester County Airport", city: "White Plains", country: "USA", lat: 41.067, lng: -73.7076 },
  { code: "ISP", name: "Long Island MacArthur", city: "Islip", country: "USA", lat: 40.7951, lng: -73.1003 },
  { code: "FRG", name: "Republic Airport", city: "Farmingdale", country: "USA", lat: 40.7271, lng: -73.4127 },
  { code: "SWF", name: "Stewart Intl", city: "New Windsor", country: "USA", lat: 41.5041, lng: -74.1044 },
  { code: "TEB", name: "Teterboro Airport", city: "Teterboro", country: "USA", lat: 40.8501, lng: -74.0608 },
  { code: "MMU", name: "Morristown Municipal", city: "Morristown", country: "USA", lat: 40.7993, lng: -74.4149 },
  { code: "BDL", name: "Bradley Intl", city: "Hartford", country: "USA", lat: 41.9389, lng: -72.6832 },
  { code: "HVN", name: "Tweed–New Haven", city: "New Haven", country: "USA", lat: 41.2637, lng: -72.8868 },
  { code: "LAX", name: "Los Angeles Intl", city: "Los Angeles", country: "USA", lat: 33.9416, lng: -118.4085 },
  { code: "SFO", name: "San Francisco Intl", city: "San Francisco", country: "USA", lat: 37.6213, lng: -122.379 },
  { code: "OAK", name: "Oakland Intl", city: "Oakland", country: "USA", lat: 37.7126, lng: -122.2197 },
  { code: "SJC", name: "San Jose Intl", city: "San Jose", country: "USA", lat: 37.3639, lng: -121.9289 },
  { code: "ORD", name: "O'Hare Intl", city: "Chicago", country: "USA", lat: 41.9742, lng: -87.9073 },
  { code: "MDW", name: "Midway Intl", city: "Chicago", country: "USA", lat: 41.7868, lng: -87.7522 },
  { code: "ATL", name: "Hartsfield–Jackson Intl", city: "Atlanta", country: "USA", lat: 33.6407, lng: -84.4277 },
  { code: "DFW", name: "Dallas/Fort Worth Intl", city: "Dallas", country: "USA", lat: 32.8998, lng: -97.0403 },
  { code: "DAL", name: "Dallas Love Field", city: "Dallas", country: "USA", lat: 32.8471, lng: -96.8517 },
  { code: "IAH", name: "George Bush Intercontinental", city: "Houston", country: "USA", lat: 29.9844, lng: -95.3414 },
  { code: "HOU", name: "William P. Hobby", city: "Houston", country: "USA", lat: 29.6454, lng: -95.2789 },
  { code: "MIA", name: "Miami Intl", city: "Miami", country: "USA", lat: 25.7959, lng: -80.287 },
  { code: "FLL", name: "Fort Lauderdale–Hollywood Intl", city: "Fort Lauderdale", country: "USA", lat: 26.0742, lng: -80.1506 },
  { code: "PHL", name: "Philadelphia Intl", city: "Philadelphia", country: "USA", lat: 39.8744, lng: -75.2424 },
  { code: "BOS", name: "Boston Logan Intl", city: "Boston", country: "USA", lat: 42.3656, lng: -71.0096 },
  { code: "DCA", name: "Ronald Reagan Washington Natl", city: "Washington", country: "USA", lat: 38.8512, lng: -77.0402 },
  { code: "IAD", name: "Washington Dulles Intl", city: "Washington", country: "USA", lat: 38.9531, lng: -77.4565 },
  { code: "BWI", name: "Baltimore/Washington Intl", city: "Baltimore", country: "USA", lat: 39.1754, lng: -76.6683 },
  { code: "PHX", name: "Phoenix Sky Harbor Intl", city: "Phoenix", country: "USA", lat: 33.4342, lng: -112.0116 },
  { code: "LAS", name: "Harry Reid Intl", city: "Las Vegas", country: "USA", lat: 36.084, lng: -115.1537 },
  { code: "DEN", name: "Denver Intl", city: "Denver", country: "USA", lat: 39.8561, lng: -104.6737 },
  { code: "MSP", name: "Minneapolis–St. Paul Intl", city: "Minneapolis", country: "USA", lat: 44.8848, lng: -93.2223 },
  { code: "DTW", name: "Detroit Metro", city: "Detroit", country: "USA", lat: 42.2162, lng: -83.3554 },
  { code: "CLT", name: "Charlotte Douglas Intl", city: "Charlotte", country: "USA", lat: 35.214, lng: -80.9431 },
  { code: "MCO", name: "Orlando Intl", city: "Orlando", country: "USA", lat: 28.4312, lng: -81.3081 },
  { code: "TPA", name: "Tampa Intl", city: "Tampa", country: "USA", lat: 27.9755, lng: -82.5332 },
  { code: "FLL", name: "Fort Lauderdale Intl", city: "Fort Lauderdale", country: "USA", lat: 26.0742, lng: -80.1506 },
  { code: "AUS", name: "Austin–Bergstrom Intl", city: "Austin", country: "USA", lat: 30.1975, lng: -97.6664 },
  { code: "SAN", name: "San Diego Intl", city: "San Diego", country: "USA", lat: 32.7338, lng: -117.1933 },
  { code: "PDX", name: "Portland Intl", city: "Portland", country: "USA", lat: 45.5887, lng: -122.5975 },
  { code: "SEA", name: "Seattle–Tacoma Intl", city: "Seattle", country: "USA", lat: 47.4502, lng: -122.3088 },
  { code: "SLC", name: "Salt Lake City Intl", city: "Salt Lake City", country: "USA", lat: 40.7899, lng: -111.9791 },
  { code: "STL", name: "St. Louis Lambert Intl", city: "St. Louis", country: "USA", lat: 38.7487, lng: -90.37 },
  { code: "BNA", name: "Nashville Intl", city: "Nashville", country: "USA", lat: 36.1245, lng: -86.6782 },
  { code: "MSY", name: "Louis Armstrong New Orleans Intl", city: "New Orleans", country: "USA", lat: 29.9934, lng: -90.258 },
  { code: "RDU", name: "Raleigh–Durham Intl", city: "Raleigh", country: "USA", lat: 35.8776, lng: -78.7875 },
  { code: "JAX", name: "Jacksonville Intl", city: "Jacksonville", country: "USA", lat: 30.4941, lng: -81.6879 },
  { code: "MEM", name: "Memphis Intl", city: "Memphis", country: "USA", lat: 35.0424, lng: -89.9767 },
  { code: "IND", name: "Indianapolis Intl", city: "Indianapolis", country: "USA", lat: 39.7173, lng: -86.2944 },
  { code: "CLE", name: "Cleveland Hopkins Intl", city: "Cleveland", country: "USA", lat: 41.4117, lng: -81.8498 },
  { code: "PIT", name: "Pittsburgh Intl", city: "Pittsburgh", country: "USA", lat: 40.4915, lng: -80.2329 },
  { code: "CVG", name: "Cincinnati/Northern Kentucky Intl", city: "Cincinnati", country: "USA", lat: 39.0488, lng: -84.6678 },
  { code: "MKE", name: "Milwaukee Mitchell Intl", city: "Milwaukee", country: "USA", lat: 42.9472, lng: -87.8966 },
  { code: "KCI", name: "Kansas City Intl", city: "Kansas City", country: "USA", lat: 39.2976, lng: -94.7139 },
  { code: "ABQ", name: "Albuquerque Intl Sunport", city: "Albuquerque", country: "USA", lat: 35.0405, lng: -106.609 },
  { code: "HNL", name: "Daniel K. Inouye Intl", city: "Honolulu", country: "USA", lat: 21.3187, lng: -157.9225 },
  { code: "ANC", name: "Ted Stevens Anchorage Intl", city: "Anchorage", country: "USA", lat: 61.1744, lng: -149.9961 },
  { code: "YYZ", name: "Toronto Pearson Intl", city: "Toronto", country: "Canada", lat: 43.6777, lng: -79.6248 },
  { code: "YVR", name: "Vancouver Intl", city: "Vancouver", country: "Canada", lat: 49.1939, lng: -123.1844 },
  { code: "YUL", name: "Montréal–Trudeau Intl", city: "Montreal", country: "Canada", lat: 45.4706, lng: -73.7408 },
  { code: "LHR", name: "London Heathrow", city: "London", country: "UK", lat: 51.47, lng: -0.4543 },
  { code: "LGW", name: "London Gatwick", city: "London", country: "UK", lat: 51.1537, lng: -0.1821 },
  { code: "CDG", name: "Paris Charles de Gaulle", city: "Paris", country: "France", lat: 49.0097, lng: 2.5479 },
  { code: "FRA", name: "Frankfurt am Main", city: "Frankfurt", country: "Germany", lat: 50.0379, lng: 8.5622 },
  { code: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Netherlands", lat: 52.3105, lng: 4.7683 },
  { code: "MAD", name: "Adolfo Suárez Madrid–Barajas", city: "Madrid", country: "Spain", lat: 40.4983, lng: -3.5676 },
  { code: "FCO", name: "Rome Fiumicino", city: "Rome", country: "Italy", lat: 41.8003, lng: 12.2389 },
  { code: "NRT", name: "Narita Intl", city: "Tokyo", country: "Japan", lat: 35.772, lng: 140.3929 },
  { code: "HND", name: "Tokyo Haneda", city: "Tokyo", country: "Japan", lat: 35.5494, lng: 139.7798 },
  { code: "DXB", name: "Dubai Intl", city: "Dubai", country: "UAE", lat: 25.2532, lng: 55.3657 },
  { code: "SYD", name: "Sydney Kingsford Smith", city: "Sydney", country: "Australia", lat: -33.9399, lng: 151.1753 },
  { code: "GRU", name: "São Paulo–Guarulhos Intl", city: "São Paulo", country: "Brazil", lat: -23.4356, lng: -46.4731 },
  { code: "MEX", name: "Mexico City Intl", city: "Mexico City", country: "Mexico", lat: 19.4361, lng: -99.0719 }
];
const serviceAreaAirports = airports.filter(
  (a) => SERVICE_AREA_AIRPORT_CODES.has(a.code)
);
const asSuggestion = (a) => ({
  placeId: `airport:${a.code}`,
  description: `${a.code} — ${a.name}, ${a.city}, ${a.country}`,
  main: `${a.code} · ${a.name}`,
  secondary: `${a.city}, ${a.country}`,
  type: "airport",
  lat: a.lat,
  lng: a.lng
});
function matchAirports(input, limit = 6) {
  const q = input.trim().toLowerCase();
  if (q.length < 2) return [];
  const codeQuery = q.replace(/[^a-z]/g, "");
  const scored = [];
  for (const a of serviceAreaAirports) {
    let score = -1;
    if (a.code.toLowerCase() === codeQuery) score = 100;
    else if (a.code.toLowerCase().startsWith(codeQuery)) score = 80;
    else if (a.city.toLowerCase().startsWith(q)) score = 60;
    else if (a.city.toLowerCase().includes(q)) score = 40;
    else if (a.name.toLowerCase().startsWith(q)) score = 55;
    else if (a.name.toLowerCase().includes(q)) score = 30;
    if (score >= 0) scored.push({ airport: a, score });
  }
  return scored.sort((x, y) => y.score - x.score).slice(0, limit).map((s) => asSuggestion(s.airport));
}
function findAirportByCode(code) {
  const c = code.trim().toUpperCase();
  return serviceAreaAirports.find((a) => a.code === c);
}
function matchAirportByText(text) {
  const trimmed = text.trim();
  if (!trimmed) return void 0;
  const codeMatch = trimmed.toUpperCase().match(/\b([A-Z]{3})\b/);
  if (codeMatch) {
    const hit = findAirportByCode(codeMatch[1]);
    if (hit) return hit;
  }
  const lower = trimmed.toLowerCase();
  return serviceAreaAirports.find(
    (a) => lower.includes(a.name.toLowerCase()) || lower.includes(`${a.city.toLowerCase()} airport`)
  );
}
function haversineMiles(aLat, aLng, bLat, bLng) {
  const toRad = (d) => d * Math.PI / 180;
  const R = 3958.7613;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
const UA$3 = "BJKLimoRideBook/1.0 (ride-booking; contact@bjklimo.local)";
const SUFFIXES = /* @__PURE__ */ new Set([
  "st",
  "street",
  "str",
  "ave",
  "avenue",
  "av",
  "blvd",
  "boulevard",
  "rd",
  "road",
  "dr",
  "drive",
  "ln",
  "lane",
  "ct",
  "court",
  "pl",
  "place",
  "ter",
  "terrace",
  "terr",
  "pkwy",
  "parkway",
  "hwy",
  "highway",
  "cir",
  "circle",
  "way",
  "trl",
  "trail"
]);
const SUFFIX_EXPAND = {
  st: "Street",
  street: "Street",
  str: "Street",
  ave: "Avenue",
  avenue: "Avenue",
  av: "Avenue",
  blvd: "Boulevard",
  boulevard: "Boulevard",
  rd: "Road",
  road: "Road",
  dr: "Drive",
  drive: "Drive",
  ln: "Lane",
  lane: "Lane",
  ct: "Court",
  court: "Court",
  pl: "Place",
  place: "Place",
  ter: "Terrace",
  terrace: "Terrace",
  terr: "Terrace",
  pkwy: "Parkway",
  parkway: "Parkway",
  hwy: "Highway",
  highway: "Highway",
  cir: "Circle",
  circle: "Circle",
  way: "Way",
  trl: "Trail",
  trail: "Trail"
};
const STATE_ABBRS = /* @__PURE__ */ new Set([
  "al",
  "ak",
  "az",
  "ar",
  "ca",
  "co",
  "ct",
  "dc",
  "de",
  "fl",
  "ga",
  "hi",
  "ia",
  "id",
  "il",
  "in",
  "ks",
  "ky",
  "la",
  "ma",
  "md",
  "me",
  "mi",
  "mn",
  "mo",
  "ms",
  "mt",
  "nc",
  "nd",
  "ne",
  "nh",
  "nj",
  "nm",
  "nv",
  "ny",
  "oh",
  "ok",
  "or",
  "pa",
  "ri",
  "sc",
  "sd",
  "tn",
  "tx",
  "ut",
  "va",
  "vt",
  "wa",
  "wi",
  "wv",
  "wy"
]);
const STATE_FULL = {
  al: "alabama",
  ak: "alaska",
  az: "arizona",
  ar: "arkansas",
  ca: "california",
  co: "colorado",
  ct: "connecticut",
  dc: "district of columbia",
  de: "delaware",
  fl: "florida",
  ga: "georgia",
  hi: "hawaii",
  ia: "iowa",
  id: "idaho",
  il: "illinois",
  in: "indiana",
  ks: "kansas",
  ky: "kentucky",
  la: "louisiana",
  ma: "massachusetts",
  md: "maryland",
  me: "maine",
  mi: "michigan",
  mn: "minnesota",
  mo: "missouri",
  ms: "mississippi",
  mt: "montana",
  nc: "north carolina",
  nd: "north dakota",
  ne: "nebraska",
  nh: "new hampshire",
  nj: "new jersey",
  nm: "new mexico",
  nv: "nevada",
  ny: "new york",
  oh: "ohio",
  ok: "oklahoma",
  or: "oregon",
  pa: "pennsylvania",
  ri: "rhode island",
  sc: "south carolina",
  sd: "south dakota",
  tn: "tennessee",
  tx: "texas",
  ut: "utah",
  va: "virginia",
  vt: "vermont",
  wa: "washington",
  wi: "wisconsin",
  wv: "west virginia",
  wy: "wyoming"
};
const STATE_FROM_NAME = Object.fromEntries(
  Object.entries(STATE_FULL).map(([abbr, name]) => [name, abbr])
);
const cache = /* @__PURE__ */ new Map();
const CACHE_TTL = 10 * 60 * 1e3;
function escapeReg(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function isSuffix(token) {
  return SUFFIXES.has(token.toLowerCase().replace(/\./g, ""));
}
function ordinalNumber(token) {
  const match = token.match(/^(\d+)(st|nd|rd|th)$/i);
  return match ? match[1] : null;
}
function ordinalSuffix(n) {
  const num = Number(n);
  const mod100 = num % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (num % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
function titleCase(value) {
  return value.split(/\s+/).filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
}
function tokenize(input) {
  return input.trim().replace(/[#.,]/g, " ").replace(/[–—]/g, "-").replace(/\s+/g, " ").split(" ").filter(Boolean);
}
function parseAddressIntent(input) {
  let tokens = tokenize(input);
  if (/^\d{5}(?:-\d{4})?$/.test(tokens[tokens.length - 1] ?? "")) tokens = tokens.slice(0, -1);
  let state = null;
  const last = (tokens[tokens.length - 1] ?? "").toLowerCase();
  const lastTwo = tokens.slice(-2).join(" ").toLowerCase();
  if (STATE_FROM_NAME[lastTwo]) {
    state = STATE_FROM_NAME[lastTwo];
    tokens = tokens.slice(0, -2);
  } else if (STATE_ABBRS.has(last)) {
    state = last;
    tokens = tokens.slice(0, -1);
  }
  let house = null;
  const hyphen = tokens[0]?.match(/^(\d{1,5})-(\d{1,5})$/);
  const third = tokens[2] ?? "";
  if (hyphen) {
    house = `${hyphen[1]}-${hyphen[2]}`;
    tokens = tokens.slice(1);
  } else if (/^\d{1,5}$/.test(tokens[0] ?? "") && /^\d{1,3}$/.test(tokens[1] ?? "") && /^\d{1,3}(?:st|nd|rd|th)?$/i.test(third)) {
    house = `${tokens[0]}-${tokens[1]}`;
    tokens = tokens.slice(2);
  } else if (/^\d{1,6}$/.test(tokens[0] ?? "")) {
    house = tokens[0];
    tokens = tokens.slice(1);
  }
  let streetOrdinal = null;
  let streetSuffix = null;
  let streetName = null;
  const leadingOrdinal = ordinalNumber(tokens[0] ?? "");
  const leadingBareStreet = /^\d{1,4}$/.test(tokens[0] ?? "") && (isSuffix(tokens[1] ?? "") || Boolean(house?.includes("-")));
  if (leadingOrdinal || leadingBareStreet) {
    streetOrdinal = leadingOrdinal ?? tokens[0];
    tokens = tokens.slice(1);
    if (tokens[0] && isSuffix(tokens[0])) {
      streetSuffix = tokens[0].toLowerCase();
      tokens = tokens.slice(1);
    }
  } else if (tokens.length) {
    const suffixIndex = tokens.findIndex((token) => isSuffix(token));
    if (suffixIndex > 0) {
      const name = tokens.slice(0, suffixIndex);
      streetSuffix = tokens[suffixIndex].toLowerCase();
      tokens = tokens.slice(suffixIndex + 1);
      const ord = name.map((token) => ordinalNumber(token)).find(Boolean) ?? null;
      streetOrdinal = ord;
      const words = name.filter((token) => !ordinalNumber(token));
      streetName = words.length ? words.join(" ") : null;
    } else if (!/^\d+$/.test(tokens[0] ?? "")) {
      streetName = tokens[0];
      tokens = tokens.slice(1);
    }
  }
  const city = tokens.length ? tokens.join(" ") : null;
  return {
    raw: input.trim(),
    house,
    streetOrdinal,
    streetSuffix,
    streetName,
    city,
    state
  };
}
function isStreetQuery(intent) {
  return Boolean(intent.house && (intent.streetOrdinal || intent.streetName));
}
function normalizedSearchQuery(intent) {
  if (!intent.house || !intent.streetOrdinal && !intent.streetName) return null;
  let street = "";
  if (intent.streetOrdinal) {
    const type = intent.streetSuffix ? SUFFIX_EXPAND[intent.streetSuffix] ?? "Street" : intent.house.includes("-") ? "Street" : "";
    const pre = intent.streetName ? `${titleCase(intent.streetName)} ` : "";
    street = `${pre}${intent.streetOrdinal}${ordinalSuffix(intent.streetOrdinal)}${type ? ` ${type}` : ""}`.trim();
  } else if (intent.streetName) {
    const type = intent.streetSuffix ? SUFFIX_EXPAND[intent.streetSuffix] ?? "" : "";
    street = `${titleCase(intent.streetName)}${type ? ` ${type}` : ""}`;
  }
  const city = intent.city ? titleCase(intent.city) : "";
  const state = intent.state ? intent.state.toUpperCase() : "";
  return [`${intent.house} ${street}`.replace(/\s+/g, " "), city, state].filter(Boolean).join(", ");
}
function suggestionMatchesIntent(text, intent) {
  const c = ` ${text.toLowerCase().replace(/[#.,]/g, " ").replace(/[–—]/g, "-").replace(/\s+/g, " ")} `;
  if (intent.house) {
    if (intent.house.includes("-")) {
      const [a, b] = intent.house.split("-");
      const hyphenated = new RegExp(`\\b${a}\\s*-\\s*${b}\\b`).test(c);
      const spaced = new RegExp(`\\b${a}\\s+${b}\\b`).test(c);
      if (!hyphenated && !spaced) return false;
    } else if (!new RegExp(`\\b${escapeReg(intent.house)}\\b`).test(c)) {
      return false;
    }
  }
  if (intent.streetOrdinal && !new RegExp(`\\b${intent.streetOrdinal}(?:st|nd|rd|th)?\\b`).test(c)) {
    return false;
  }
  if (intent.streetName) {
    const name = intent.streetName.toLowerCase();
    if (!c.includes(` ${name} `) && !c.includes(` ${name}`)) return false;
  }
  if (intent.city) {
    for (const token of intent.city.toLowerCase().split(/\s+/)) {
      if (token.length < 2) continue;
      if (!new RegExp(`\\b${escapeReg(token)}\\b`).test(c)) return false;
    }
  }
  if (intent.state) {
    const abbr = intent.state.toLowerCase();
    const full = STATE_FULL[abbr];
    const hasAbbr = new RegExp(`\\b${abbr}\\b`).test(c);
    const hasFull = full ? c.includes(full) : false;
    if (!hasAbbr && !hasFull) return false;
  }
  return true;
}
function houseNumberInText(text, house) {
  if (!house) return true;
  const c = ` ${text.toLowerCase().replace(/[#.,]/g, " ").replace(/[–—]/g, "-").replace(/\s+/g, " ")} `;
  if (house.includes("-")) {
    const [a, b] = house.split("-");
    const hyphenated = new RegExp(`\\b${a}\\s*-\\s*${b}\\b`).test(c);
    const spaced = new RegExp(`\\b${a}\\s+${b}\\b`).test(c);
    return hyphenated || spaced;
  }
  return new RegExp(`\\b${escapeReg(house)}\\b`).test(c);
}
function titleCasePart(part) {
  return part.split(/\s+/).filter(Boolean).map((word) => {
    if (/^\d{5}(?:-\d{4})?$/.test(word)) return word;
    if (/^[A-Za-z]{2}$/.test(word) && STATE_ABBRS.has(word.toLowerCase())) return word.toUpperCase();
    const ord = word.match(/^(\d+)(st|nd|rd|th)$/i);
    if (ord) return `${ord[1]}${ord[2].toLowerCase()}`;
    if (/^\d+-\d+$/.test(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(" ");
}
function presentAddress(raw) {
  let parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  if (/^(usa|u\.s\.a\.|united states)$/i.test(parts[parts.length - 1] ?? "")) parts.pop();
  parts = parts.map(titleCasePart);
  if (parts[0]) {
    parts[0] = parts[0].replace(/\b(St|Ave|Blvd|Rd|Dr|Ln|Ct|Pl|Ter|Pkwy|Hwy|Cir|Trl)\b$/, (suffix) => {
      return SUFFIX_EXPAND[suffix.toLowerCase()] ?? suffix;
    });
  }
  if (parts.length >= 2 && /^[A-Z]{2}$/.test(parts[parts.length - 2] ?? "") && /^\d{5}/.test(parts[parts.length - 1] ?? "")) {
    const zip = parts.pop();
    parts[parts.length - 1] = `${parts[parts.length - 1]} ${zip}`;
  }
  const main = parts[0] || raw;
  const secondary = parts.slice(1).join(", ");
  return { main, secondary, description: secondary ? `${main}, ${secondary}` : main };
}
function dedupeKey(text) {
  const house = text.match(/\b(\d{1,5})\s*[-–]\s*(\d{1,5})\b/) ?? text.match(/\b(\d{1,6})\b/);
  const ord = text.match(/\b(\d+)(?:st|nd|rd|th)\b/i);
  const zip = text.match(/\b(\d{5})\b/);
  if (house && ord) {
    const houseKey = house[2] ? `${house[1]}-${house[2]}` : house[1];
    return `${houseKey}|${ord[1]}|${zip?.[1] ?? ""}`;
  }
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function rank(hit, intent) {
  let score = 0;
  if (hit.source === "census") score += 40;
  if (hit.source === "arcgis") score += 20;
  if (intent.house?.includes("-") && hit.formattedAddress.includes(intent.house)) score += 30;
  if (intent.city && suggestionMatchesIntent(hit.formattedAddress, intent)) score += 10;
  return score;
}
function remember(key, hits) {
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), hits });
  return hits;
}
function cached(key) {
  const row = cache.get(key);
  if (!row) return null;
  if (Date.now() - row.at > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return row.hits;
}
async function censusLookup(query, signal) {
  const key = `census:${query.toLowerCase()}`;
  const hit = cached(key);
  if (hit) return hit;
  try {
    const res = await fetch(
      `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(query)}&benchmark=Public_AR_Current&format=json`,
      { signal, headers: { "User-Agent": UA$3, Accept: "application/json" } }
    );
    if (!res.ok) return [];
    const data2 = await res.json();
    const hits = [];
    for (const match of data2.result?.addressMatches ?? []) {
      const lat = match.coordinates?.y;
      const lng = match.coordinates?.x;
      if (!match.matchedAddress || typeof lat !== "number" || typeof lng !== "number") continue;
      const presented = presentAddress(match.matchedAddress);
      hits.push({ ...presented, formattedAddress: presented.description, lat, lng, source: "census" });
    }
    return remember(key, hits.filter((hit2) => textInServiceArea(hit2.formattedAddress)));
  } catch {
    return [];
  }
}
async function arcgisFind(query, signal) {
  const key = `arcgis:${query.toLowerCase()}`;
  const hit = cached(key);
  if (hit) return hit;
  try {
    const res = await fetch(
      `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&maxLocations=8&singleLine=${encodeURIComponent(query)}`,
      { signal, headers: { "User-Agent": UA$3, Accept: "application/json" } }
    );
    if (!res.ok) return [];
    const data2 = await res.json();
    const hits = [];
    for (const candidate of data2.candidates ?? []) {
      const lat = candidate.location?.y;
      const lng = candidate.location?.x;
      if (!candidate.address || typeof lat !== "number" || typeof lng !== "number") continue;
      if (typeof candidate.score === "number" && candidate.score < 80) continue;
      const presented = presentAddress(candidate.address);
      hits.push({ ...presented, formattedAddress: presented.description, lat, lng, source: "arcgis" });
    }
    return remember(key, hits.filter((hit2) => textInServiceArea(hit2.formattedAddress)));
  } catch {
    return [];
  }
}
async function photonLookup$1(query, signal) {
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`,
      { signal, headers: { "User-Agent": UA$3 } }
    );
    if (!res.ok) return [];
    const data2 = await res.json();
    const hits = [];
    for (const feature of data2.features ?? []) {
      const coords = feature.geometry?.coordinates;
      const props = feature.properties ?? {};
      if (!serviceStateAbbr(props.state)) continue;
      if (!coords || coords.length < 2 || !props.housenumber || !props.street) continue;
      const city = props.locality || props.district || props.city || "";
      const raw = [props.housenumber, props.street, city, props.state, props.postcode].filter(Boolean).join(", ");
      const presented = presentAddress(raw);
      hits.push({
        ...presented,
        formattedAddress: presented.description,
        lat: coords[1],
        lng: coords[0],
        source: "photon"
      });
    }
    return hits;
  } catch {
    return [];
  }
}
function queriesFor(input, intent) {
  const normalized = normalizedSearchQuery(intent);
  const queries = [input.trim()];
  if (normalized && normalized.toLowerCase() !== input.trim().toLowerCase()) queries.push(normalized);
  return queries;
}
function relevantHits(hits, intent) {
  const seen = /* @__PURE__ */ new Set();
  const matched = hits.filter((hit) => suggestionMatchesIntent(hit.formattedAddress, intent) || suggestionMatchesIntent(`${hit.main} ${hit.secondary}`, intent)).sort((a, b) => rank(b, intent) - rank(a, intent));
  const unique = [];
  for (const hit of matched) {
    const key = dedupeKey(hit.formattedAddress);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(hit);
  }
  return sameLocality(unique);
}
function sameLocality(hits) {
  if (hits.length <= 1) return hits;
  const locality = (hits[0].secondary.split(",")[0] ?? "").trim().toLowerCase();
  if (!locality) return hits;
  const family = hits.filter((hit) => (hit.secondary.split(",")[0] ?? "").trim().toLowerCase() === locality);
  return family.length ? family : hits;
}
async function lookupStreetAddress(input, signal) {
  const intent = parseAddressIntent(input);
  if (!isStreetQuery(intent)) return null;
  if (intent.state && !isServiceState(intent.state)) return null;
  const queries = queriesFor(input, intent);
  const batches = await Promise.all(
    queries.flatMap((query) => [censusLookup(query, signal), arcgisFind(query, signal)])
  );
  let hits = relevantHits(batches.flat(), intent);
  if (!hits.length) {
    const photon = await Promise.all(queries.map((query) => photonLookup$1(query, signal)));
    hits = relevantHits(photon.flat(), intent);
  }
  return hits[0] ?? null;
}
async function suggestStreetAddresses(input, signal) {
  const intent = parseAddressIntent(input);
  if (!isStreetQuery(intent)) return [];
  if (intent.state && !isServiceState(intent.state)) return [];
  const queries = queriesFor(input, intent);
  const preferred = queries[queries.length - 1] ?? input;
  const [found, suggested] = await Promise.all([
    Promise.all(queries.flatMap((query) => [censusLookup(query, signal), arcgisFind(query, signal)])),
    arcgisSuggest(preferred, signal)
  ]);
  let hits = relevantHits([...found.flat(), ...suggested], intent);
  if (!hits.length) {
    const photon = await Promise.all(queries.map((query) => photonLookup$1(query, signal)));
    hits = relevantHits(photon.flat(), intent);
  }
  return hits.slice(0, 5).map((hit) => ({
    placeId: `${hit.source}:${hit.lat},${hit.lng}`,
    description: hit.formattedAddress,
    main: hit.main,
    secondary: hit.secondary,
    lat: hit.lat,
    lng: hit.lng,
    type: "place"
  }));
}
async function arcgisSuggest(query, signal) {
  try {
    const res = await fetch(
      `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?f=json&maxSuggestions=6&text=${encodeURIComponent(query)}`,
      { signal, headers: { "User-Agent": UA$3, Accept: "application/json" } }
    );
    if (!res.ok) return [];
    const data2 = await res.json();
    const texts = (data2.suggestions ?? []).map((item) => item.text ?? "").filter(Boolean);
    if (!texts.length) return [];
    const intent = parseAddressIntent(query);
    const relevant = texts.filter((text) => suggestionMatchesIntent(text, intent));
    const resolved = await Promise.all(relevant.slice(0, 3).map((text) => arcgisFind(text, signal)));
    const hits = resolved.flat().filter((hit) => suggestionMatchesIntent(hit.formattedAddress, intent));
    if (hits.length) return hits;
    const census = await Promise.all(relevant.slice(0, 2).map((text) => censusLookup(text, signal)));
    return census.flat();
  } catch {
    return [];
  }
}
const UA$2 = "BJKLimoRideBook/1.0 (ride-booking; contact@bjklimo.local)";
function formatPhotonParts(p) {
  const street = [p.housenumber, p.street].filter(Boolean).join(" ") || p.name || "";
  const city = p.city || p.district || p.county || "";
  const secondary = [[p.postcode, city].filter(Boolean).join(" "), p.state, p.country].filter(Boolean).join(", ");
  return {
    main: street,
    secondary
  };
}
async function photonSuggestions(input, signal) {
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(input)}&limit=6&lang=en`, {
      signal,
      headers: {
        "User-Agent": UA$2
      }
    });
    if (!res.ok) return [];
    const data2 = await res.json();
    const out = [];
    const seenPlaceIds = /* @__PURE__ */ new Set();
    for (const f of data2.features ?? []) {
      const coords = f.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;
      if (!serviceStateAbbr(f.properties?.state)) continue;
      const {
        main,
        secondary
      } = formatPhotonParts(f.properties ?? {});
      const description = [main, secondary].filter(Boolean).join(", ");
      if (!description) continue;
      const placeId = `photon:${coords[0]},${coords[1]}`;
      if (seenPlaceIds.has(placeId)) continue;
      seenPlaceIds.add(placeId);
      out.push({
        placeId,
        description,
        main,
        secondary,
        lat: coords[1],
        lng: coords[0],
        type: "place"
      });
    }
    return out.slice(0, 6);
  } catch {
    return [];
  }
}
const loader$b = withApi(async ({
  request
}) => {
  const url = new URL(request.url);
  const input = (url.searchParams.get("input") ?? "").trim();
  const configured = Boolean(process.env.GOOGLE_MAPS_API_KEY);
  if (input.length < 2) {
    return json({
      suggestions: [],
      configured,
      source: "none"
    });
  }
  const intent = parseAddressIntent(input);
  if (intent.state && !isServiceState(intent.state)) {
    return json({
      suggestions: [],
      configured,
      source: "none",
      outOfArea: true
    });
  }
  const airportSuggestions = matchAirports(input, 3);
  const merge = (places) => {
    const merged = [...airportSuggestions];
    for (const p of places) {
      if (merged.length >= 6) break;
      const dupe = merged.some((m) => m.description.toLowerCase() === p.description.toLowerCase());
      if (!dupe) merged.push(p);
    }
    return merged.slice(0, 6);
  };
  if (isStreetQuery(intent)) {
    const suggestions = await suggestStreetAddresses(input, request.signal);
    if (suggestions.length > 0) {
      return json({
        suggestions,
        configured,
        source: "street"
      });
    }
    const photon2 = await photonSuggestions(input, request.signal);
    return json({
      suggestions: merge(photon2),
      configured,
      source: photon2.length ? "photon" : airportSuggestions.length ? "airports" : "none"
    });
  }
  if (configured) {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    try {
      const upstream = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${key}&types=geocode&language=en`, {
        signal: request.signal
      });
      if (upstream.ok) {
        const data2 = await upstream.json();
        const suggestions = (data2.predictions ?? []).filter((p) => serviceStateFromText(p.description ?? "")).slice(0, 6).map((p) => ({
          placeId: p.place_id ?? "",
          description: p.description ?? "",
          main: p.structured_formatting?.main_text ?? "",
          secondary: p.structured_formatting?.secondary_text ?? "",
          type: "place"
        }));
        if (suggestions.length > 0 || airportSuggestions.length > 0) {
          return json({
            suggestions: merge(suggestions),
            configured,
            source: "google"
          });
        }
      }
    } catch {
    }
  }
  const photon = await photonSuggestions(input, request.signal);
  if (photon.length > 0 || airportSuggestions.length > 0) {
    return json({
      suggestions: merge(photon),
      configured,
      source: photon.length > 0 ? "photon" : "airports"
    });
  }
  return json({
    suggestions: matchAirports(input),
    configured,
    source: "airports"
  });
});
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$b
}, Symbol.toStringTag, { value: "Module" }));
function clampAdvanceHours$1(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_PRICING.minAdvanceHours;
  return Math.min(24, Math.max(1, Math.round(n)));
}
const PB_PUBLIC_URL$1 = "/hcgi/platform";
const tierPhotoUrl$1 = (id, photo) => id && photo ? `${PB_PUBLIC_URL$1}/api/files/vehicle_tiers/${id}/${photo}` : "";
async function buildPricingSnapshot(rawBizId, cacheable = true) {
  const configured = Boolean(process.env.GOOGLE_MAPS_API_KEY);
  const bizId = await resolveBusinessId(rawBizId);
  let record = null;
  let owner = "";
  try {
    if (bizId) {
      const result = await pocketbaseAdmin.listRecords("settings", {
        perPage: 1,
        sort: "-updated,-created",
        filter: `owner = "${bizId}"`
      });
      record = result.items[0] ?? null;
      owner = bizId;
    } else {
      const result = await pocketbaseAdmin.listRecords("settings", {
        perPage: 1,
        sort: "-updated,-created"
      });
      record = result.items[0] ?? null;
      owner = record?.owner ?? "";
    }
  } catch {
    record = null;
  }
  const pricing = record ? {
    baseRate: record.baseRate ?? DEFAULT_PRICING.baseRate,
    minimumFare: record.minimumFare ?? DEFAULT_PRICING.minimumFare,
    perMileRate: record.perMileRate ?? DEFAULT_PRICING.perMileRate,
    hourlyRate: record.hourlyRate ?? DEFAULT_PRICING.hourlyRate,
    currency: record.currency ?? DEFAULT_PRICING.currency,
    tipEnabled: !!record.tipEnabled,
    tipPercent: record.tipPercent ?? DEFAULT_PRICING.tipPercent,
    taxEnabled: !!record.taxEnabled,
    taxPercent: record.taxPercent ?? DEFAULT_PRICING.taxPercent,
    tollsEnabled: !!record.tollsEnabled,
    fareVisible: record.fareVisible !== false,
    paymentRequired: record.paymentRequired !== false,
    carSeatPrice: record.carSeatPrice ?? DEFAULT_PRICING.carSeatPrice,
    extraStopPrice: record.extraStopPrice ?? DEFAULT_PRICING.extraStopPrice,
    insidePickupPrice: record.insidePickupPrice ?? DEFAULT_PRICING.insidePickupPrice,
    minAdvanceHours: clampAdvanceHours$1(record.minAdvanceHours)
  } : DEFAULT_PRICING;
  const businessName = record?.businessName ?? "";
  let vehicleTiers = DEFAULT_TIERS;
  if (owner) {
    try {
      const result = await pocketbaseAdmin.listRecords("vehicle_tiers", {
        sort: "sort",
        perPage: 50,
        filter: `owner = "${owner}"`
      });
      if (result.items.length) {
        vehicleTiers = result.items.filter((r) => r.active !== false).map((r) => ({
          key: r.key ?? "",
          name: r.name ?? r.key ?? "",
          detail: r.detail ?? "",
          capacity: r.capacity ?? 3,
          minFare: r.minFare ?? 0,
          multiplier: r.multiplier ?? 1,
          perMileRate: r.perMileRate ?? 0,
          active: r.active !== false,
          sort: r.sort ?? 0,
          photo: tierPhotoUrl$1(r.id, r.photo)
        }));
      }
    } catch {
      vehicleTiers = DEFAULT_TIERS;
    }
  }
  return json(
    {
      ...pricing,
      businessName,
      vehicleTiers,
      mapsConfigured: configured,
      // The in-page Square card form needs the PUBLIC application id (browser
      // SDK) plus the secret access token and location id (server-side). All
      // three must be configured before a required-payment booking can charge
      // a card. Only the public app id + environment are sent to the browser;
      // the access token never leaves the server.
      squareConfigured: Boolean(process.env.SQUARE_APP_ID && process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID),
      squareAppId: process.env.SQUARE_APP_ID ?? "",
      squareLocationId: process.env.SQUARE_LOCATION_ID ?? "",
      squareEnvironment: process.env.SQUARE_ENVIRONMENT === "sandbox" ? "sandbox" : "production",
      hasSettings: Boolean(record),
      bizId: owner
    },
    // The GET loader is public, cacheable data (the platform edge-caches GET
    // by URL regardless). The POST action — which the booking flow's
    // `usePricing` hook calls specifically to pick up operator rate/visibility
    // changes without serving a stale edge-cached snapshot — MUST be
    // `no-store`, otherwise a saved change (e.g. enabling customer price
    // visibility) can be held back for the cache window and the customer
    // panel keeps rendering the previous settings.
    {
      headers: {
        "Cache-Control": cacheable ? "public, max-age=10" : "no-store"
      }
    }
  );
}
const loader$a = withApi(async ({
  request
}) => {
  const url = new URL(request.url);
  return buildPricingSnapshot(url.searchParams.get("biz"));
});
const action$f = withApi(async ({
  request
}) => {
  let body = {};
  try {
    body = await readJsonBody(request);
  } catch {
  }
  return buildPricingSnapshot(body.biz, false);
});
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$f,
  loader: loader$a
}, Symbol.toStringTag, { value: "Module" }));
const PB_URL$5 = () => process.env.POCKETBASE_URL || "http://localhost:8090";
function decodeCallerId$4(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return "";
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload.id === "string" ? payload.id : "";
  } catch {
    return "";
  }
}
async function verifyCaller$4(authHeader) {
  if (!authHeader) throw apiError(401, "Sign in required.");
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw apiError(401, "Sign in required.");
  const callerId = decodeCallerId$4(token);
  if (!callerId) throw apiError(401, "Your session has expired. Please sign in again.");
  const client = new PocketBase(PB_URL$5());
  client.autoCancellation(false);
  client.authStore.save(token, null);
  try {
    await client.collection("users").getOne(callerId);
    return callerId;
  } catch {
    throw apiError(401, "Your session has expired. Please sign in again.");
  }
}
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "business";
}
async function ensureBusinessName(ownerId, businessName) {
  let existing = null;
  try {
    const result = await pocketbaseAdmin.listRecords("settings", {
      perPage: 1,
      sort: "-created",
      filter: `owner = "${ownerId}"`
    });
    existing = result.items[0] ?? null;
  } catch {
    existing = null;
  }
  try {
    if (existing) {
      await pocketbaseAdmin.updateRecord("settings", existing.id, {
        businessName,
        dispatchName: `${businessName} Dispatch`
      });
    } else {
      await pocketbaseAdmin.createRecord("settings", {
        owner: ownerId,
        businessName,
        dispatchName: `${businessName} Dispatch`,
        baseRate: 5,
        minimumFare: 25,
        perMileRate: 3.5,
        hourlyRate: 65,
        currency: "USD",
        dispatchEmail: "",
        customerEmailEnabled: true,
        fareVisible: false,
        paymentRequired: true
      });
    }
  } catch {
  }
}
function deriveBusinessEmail(operatorEmail, businessName, suffix) {
  const at = operatorEmail.indexOf("@");
  if (at < 1) return `${slugify(businessName)}+${suffix}@managed.local`;
  const local = operatorEmail.slice(0, at);
  const domain = operatorEmail.slice(at + 1);
  return `${local}+${slugify(businessName)}-${suffix}@${domain}`;
}
const loader$9 = withApi(async () => {
  try {
    const users = await pocketbaseAdmin.listRecords("users", {
      perPage: 500,
      sort: "created"
    });
    const settings = await pocketbaseAdmin.listRecords("settings", {
      perPage: 500,
      sort: "created"
    });
    const nameByOwner = /* @__PURE__ */ new Map();
    for (const s of settings.items) {
      const owner = Array.isArray(s.owner) ? s.owner[0] : s.owner;
      if (owner && s.businessName) nameByOwner.set(owner, s.businessName);
    }
    const businesses = users.items.map((u) => {
      const managedRaw = u.managedBy;
      const managedBy = Array.isArray(managedRaw) ? managedRaw[0] || "" : managedRaw || "";
      return {
        id: u.id,
        email: u.email ?? "",
        businessName: nameByOwner.get(u.id) || u.name || "",
        managedBy,
        created: u.created ?? ""
      };
    });
    return json({
      businesses
    });
  } catch {
    return json({
      businesses: []
    });
  }
});
const action$e = withApi(async ({
  request
}) => {
  const callerId = await verifyCaller$4(request.headers.get("authorization"));
  if (request.method === "DELETE") {
    const body2 = await readJsonBody(request);
    const bizId = (body2.biz || "").trim();
    if (!/^[a-z0-9]{15}$/.test(bizId)) return apiError(422, "Business id is required.");
    if (bizId === callerId) return apiError(400, "You cannot delete your own account.");
    let target;
    try {
      target = await pocketbaseAdmin.getRecord("users", bizId);
    } catch {
      return apiError(404, "Business not found.");
    }
    const mb = target.managedBy;
    const mbId = Array.isArray(mb) ? mb[0] || "" : mb ? String(mb) : "";
    if (mbId !== callerId) return apiError(403, "You can only delete businesses you manage.");
    try {
      const resList = await pocketbaseAdmin.listRecords("reservations", {
        perPage: 500,
        sort: "-created",
        filter: `owner = "${bizId}"`
      });
      for (const r of resList.items) {
        await pocketbaseAdmin.updateRecord("reservations", r.id, {
          owner: callerId
        });
      }
    } catch (err) {
      throw new Error(`Failed to reassign reservations: ${err instanceof Error ? err.message : String(err)}`);
    }
    try {
      const sList = await pocketbaseAdmin.listRecords("settings", {
        perPage: 500,
        filter: `owner = "${bizId}"`
      });
      for (const r of sList.items) await pocketbaseAdmin.deleteRecord("settings", r.id);
    } catch {
    }
    try {
      const tList = await pocketbaseAdmin.listRecords("vehicle_tiers", {
        perPage: 500,
        filter: `owner = "${bizId}"`
      });
      for (const r of tList.items) await pocketbaseAdmin.deleteRecord("vehicle_tiers", r.id);
    } catch {
    }
    try {
      await pocketbaseAdmin.deleteRecord("users", bizId);
    } catch (err) {
      throw new Error(`Failed to delete business account: ${err instanceof Error ? err.message : String(err)}`);
    }
    return json({
      ok: true,
      id: bizId
    });
  }
  const body = await readJsonBody(request);
  const businessName = (body.businessName || "").trim();
  if (!businessName) return apiError(422, "Business name is required.");
  if (businessName.length > 80) return apiError(422, "Business name is too long.");
  let operatorEmail = "";
  try {
    const caller = await pocketbaseAdmin.getRecord("users", callerId);
    operatorEmail = (caller.email || "").trim();
  } catch {
    throw apiError(401, "Your session has expired. Please sign in again.");
  }
  let email = deriveBusinessEmail(operatorEmail, businessName, randomBytes(4).toString("hex"));
  try {
    const existing = await pocketbaseAdmin.listRecords("users", {
      perPage: 1,
      filter: `email = "${email}"`
    });
    if (existing.items.length > 0) {
      email = deriveBusinessEmail(operatorEmail, businessName, randomBytes(6).toString("hex"));
    }
  } catch {
  }
  try {
    const password = randomBytes(18).toString("base64url");
    const rec = await pocketbaseAdmin.createRecord("users", {
      email,
      password,
      passwordConfirm: password,
      name: businessName,
      managedBy: callerId
    });
    try {
      await pocketbaseAdmin.updateRecord("users", rec.id, {
        name: businessName
      });
    } catch {
    }
    await ensureBusinessName(rec.id, businessName);
    return json({
      id: rec.id,
      businessName,
      email,
      link: `/?biz=${rec.id}`
    });
  } catch (err) {
    throw new Error(`Failed to create business: ${err instanceof Error ? err.message : String(err)}`);
  }
});
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$e,
  loader: loader$9
}, Symbol.toStringTag, { value: "Module" }));
function clampAdvanceHours(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_PRICING.minAdvanceHours;
  return Math.min(24, Math.max(1, Math.round(n)));
}
const PB_URL$4 = () => process.env.POCKETBASE_URL || "http://localhost:8090";
function decodeCallerId$3(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return "";
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload.id === "string" ? payload.id : "";
  } catch {
    return "";
  }
}
async function verifyCaller$3(authHeader) {
  if (!authHeader) throw apiError(401, "Sign in required.");
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw apiError(401, "Sign in required.");
  const callerId = decodeCallerId$3(token);
  if (!callerId) throw apiError(401, "Your session has expired. Please sign in again.");
  const client = new PocketBase(PB_URL$4());
  client.autoCancellation(false);
  client.authStore.save(token, null);
  try {
    await client.collection("users").getOne(callerId);
    return callerId;
  } catch {
    throw apiError(401, "Your session has expired. Please sign in again.");
  }
}
function normalizeBizId$2(raw) {
  const value = (raw ?? "").trim();
  return /^[a-z0-9]{15}$/.test(value) ? value : "";
}
async function authorizeTarget$1(bizId, callerId) {
  let target;
  try {
    target = await pocketbaseAdmin.getRecord("users", bizId);
  } catch {
    throw apiError(404, "Business not found.");
  }
  if (target.id === callerId) return;
  const mb = target.managedBy;
  const mbId = Array.isArray(mb) ? mb[0] || "" : mb ? String(mb) : "";
  if (mbId === callerId) return;
  throw apiError(403, "You can only edit businesses you own or manage.");
}
async function loadSettingsRow(bizId) {
  try {
    const result = await pocketbaseAdmin.listRecords("settings", {
      perPage: 1,
      sort: "-updated,-created",
      filter: `owner = "${bizId}"`
    });
    return result.items[0] ?? null;
  } catch {
    return null;
  }
}
function toSettingsPayload(s) {
  return {
    baseRate: Number(s.baseRate) || 0,
    minimumFare: Number(s.minimumFare) || 0,
    perMileRate: Number(s.perMileRate) || 0,
    hourlyRate: Number(s.hourlyRate) || 0,
    currency: (s.currency || "").trim().toUpperCase() || "USD",
    tipEnabled: !!s.tipEnabled,
    tipPercent: Number(s.tipPercent) || 0,
    taxEnabled: !!s.taxEnabled,
    taxPercent: Number(s.taxPercent) || 0,
    tollsEnabled: !!s.tollsEnabled,
    fareVisible: !!s.fareVisible,
    paymentRequired: s.paymentRequired !== false,
    businessName: (s.businessName || "").trim(),
    dispatchEmail: (s.dispatchEmail || "").trim(),
    dispatchName: (s.dispatchName || "").trim(),
    customerEmailEnabled: !!s.customerEmailEnabled,
    carSeatPrice: Number(s.carSeatPrice) || 0,
    extraStopPrice: Number(s.extraStopPrice) || 0,
    insidePickupPrice: Number(s.insidePickupPrice) || 0,
    minAdvanceHours: clampAdvanceHours(s.minAdvanceHours)
  };
}
function toSettingsResponse(s) {
  return {
    id: s?.id ?? "",
    businessName: s?.businessName ?? "",
    baseRate: s?.baseRate ?? DEFAULT_PRICING.baseRate,
    minimumFare: s?.minimumFare ?? DEFAULT_PRICING.minimumFare,
    perMileRate: s?.perMileRate ?? DEFAULT_PRICING.perMileRate,
    hourlyRate: s?.hourlyRate ?? DEFAULT_PRICING.hourlyRate,
    currency: s?.currency ?? DEFAULT_PRICING.currency,
    tipEnabled: !!s?.tipEnabled,
    tipPercent: s?.tipPercent ?? DEFAULT_PRICING.tipPercent,
    taxEnabled: !!s?.taxEnabled,
    taxPercent: s?.taxPercent ?? DEFAULT_PRICING.taxPercent,
    tollsEnabled: !!s?.tollsEnabled,
    fareVisible: !!s?.fareVisible,
    paymentRequired: s?.paymentRequired !== false,
    dispatchEmail: s?.dispatchEmail ?? "",
    dispatchName: s?.dispatchName ?? "Dispatch",
    customerEmailEnabled: s?.customerEmailEnabled !== false,
    carSeatPrice: s?.carSeatPrice ?? DEFAULT_PRICING.carSeatPrice,
    extraStopPrice: s?.extraStopPrice ?? DEFAULT_PRICING.extraStopPrice,
    insidePickupPrice: s?.insidePickupPrice ?? DEFAULT_PRICING.insidePickupPrice,
    minAdvanceHours: clampAdvanceHours(s?.minAdvanceHours),
    hasSettings: Boolean(s)
  };
}
const action$d = withApi(async ({
  request
}) => {
  const callerId = await verifyCaller$3(request.headers.get("authorization"));
  const body = await readJsonBody(request);
  const op = (body.op || "load").toLowerCase();
  const bizId = normalizeBizId$2(body.biz);
  if (!bizId) return apiError(422, "Business id is required.");
  await authorizeTarget$1(bizId, callerId);
  if (op === "save") {
    const payload = toSettingsPayload(body.settings ?? {});
    const existing = await loadSettingsRow(bizId);
    let saved;
    if (existing?.id) {
      saved = await pocketbaseAdmin.updateRecord("settings", existing.id, payload);
    } else {
      saved = await pocketbaseAdmin.createRecord("settings", {
        ...payload,
        owner: bizId
      });
    }
    try {
      await pocketbaseAdmin.updateRecord("users", bizId, {
        name: payload.businessName
      });
    } catch {
    }
    return json({
      settings: toSettingsResponse(saved)
    });
  }
  const row = await loadSettingsRow(bizId);
  return json({
    settings: toSettingsResponse(row)
  });
});
const route14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$d
}, Symbol.toStringTag, { value: "Module" }));
const PB_URL$3 = () => process.env.POCKETBASE_URL || "http://localhost:8090";
const PB_PUBLIC_URL = "/hcgi/platform";
const tierPhotoUrl = (id, photo) => id && photo ? `${PB_PUBLIC_URL}/api/files/vehicle_tiers/${id}/${photo}` : "";
function decodeCallerId$2(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return "";
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload.id === "string" ? payload.id : "";
  } catch {
    return "";
  }
}
async function verifyCaller$2(authHeader) {
  if (!authHeader) throw apiError(401, "Sign in required.");
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw apiError(401, "Sign in required.");
  const callerId = decodeCallerId$2(token);
  if (!callerId) throw apiError(401, "Your session has expired. Please sign in again.");
  const client = new PocketBase(PB_URL$3());
  client.autoCancellation(false);
  client.authStore.save(token, null);
  try {
    await client.collection("users").getOne(callerId);
    return callerId;
  } catch {
    throw apiError(401, "Your session has expired. Please sign in again.");
  }
}
function normalizeBizId$1(raw) {
  const value = (raw ?? "").trim();
  return /^[a-z0-9]{15}$/.test(value) ? value : "";
}
async function authorizeTarget(bizId, callerId) {
  let target;
  try {
    target = await pocketbaseAdmin.getRecord("users", bizId);
  } catch {
    throw apiError(404, "Business not found.");
  }
  if (target.id === callerId) return;
  const mb = target.managedBy;
  const mbId = Array.isArray(mb) ? mb[0] || "" : mb ? String(mb) : "";
  if (mbId === callerId) return;
  throw apiError(403, "You can only edit businesses you own or manage.");
}
async function loadTiers(bizId) {
  try {
    const result = await pocketbaseAdmin.listRecords("vehicle_tiers", {
      sort: "sort",
      perPage: 50,
      filter: `owner = "${bizId}"`
    });
    return result.items;
  } catch {
    return [];
  }
}
function toTierResponse(t, index) {
  return {
    id: t.id ?? "",
    key: t.key ?? DEFAULT_TIERS[index]?.key ?? `tier${index}`,
    name: t.name ?? DEFAULT_TIERS[index]?.name ?? "",
    detail: t.detail ?? "",
    capacity: t.capacity ?? 3,
    minFare: t.minFare ?? 0,
    multiplier: t.multiplier ?? 1,
    perMileRate: t.perMileRate ?? 0,
    active: t.active !== false,
    sort: t.sort ?? index + 1,
    photo: tierPhotoUrl(t.id, t.photo)
  };
}
const action$c = withApi(async ({
  request
}) => {
  const callerId = await verifyCaller$2(request.headers.get("authorization"));
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await readFormData(request);
    const op2 = form.get("op")?.toLowerCase() ?? "";
    const bizId2 = normalizeBizId$1(form.get("biz"));
    if (!bizId2) return apiError(422, "Business id is required.");
    await authorizeTarget(bizId2, callerId);
    if (op2 === "upload-photo") {
      const tierId = normalizeBizId$1(form.get("tierId"));
      if (!tierId) return apiError(422, "Vehicle category id is required.");
      const file = form.get("photo");
      if (!(file instanceof File) || file.size === 0) {
        return apiError(422, "A photo file is required.");
      }
      const existing = await loadTiers(bizId2);
      if (!existing.some((t) => t.id === tierId)) {
        return apiError(404, "Vehicle category not found.");
      }
      const fd = new FormData();
      fd.append("photo", file, file.name);
      const updated = await pocketbaseAdmin.updateRecord("vehicle_tiers", tierId, fd);
      return json({
        photo: tierPhotoUrl(updated.id, updated.photo)
      });
    }
    return apiError(422, "Unsupported multipart operation.");
  }
  const body = await readJsonBody(request);
  const op = (body.op || "load").toLowerCase();
  const bizId = normalizeBizId$1(body.biz);
  if (!bizId) return apiError(422, "Business id is required.");
  await authorizeTarget(bizId, callerId);
  if (op === "remove-photo") {
    const tierId = normalizeBizId$1(body.tierId);
    if (!tierId) return apiError(422, "Vehicle category id is required.");
    const existing = await loadTiers(bizId);
    if (!existing.some((t) => t.id === tierId)) {
      return apiError(404, "Vehicle category not found.");
    }
    await pocketbaseAdmin.updateRecord("vehicle_tiers", tierId, {
      photo: null
    });
    return json({
      photo: ""
    });
  }
  if (op === "save") {
    const incoming = Array.isArray(body.tiers) ? body.tiers : [];
    const existing = await loadTiers(bizId);
    const existingIds = new Set(existing.map((t) => t.id).filter(Boolean));
    const saved = [];
    for (let i = 0; i < incoming.length; i += 1) {
      const t = incoming[i] ?? {};
      const payload = {
        key: (t.key || "").trim() || DEFAULT_TIERS[i]?.key || `tier${i + 1}`,
        name: (t.name || "").trim() || DEFAULT_TIERS[i]?.name || `Tier ${i + 1}`,
        detail: (t.detail || "").trim(),
        capacity: Number(t.capacity) || 3,
        minFare: Number(t.minFare) || 0,
        multiplier: Number(t.multiplier) || 1,
        perMileRate: Number(t.perMileRate) || 0,
        active: !!t.active,
        sort: i + 1,
        owner: bizId
      };
      if (t.id && existingIds.has(t.id)) {
        saved.push(await pocketbaseAdmin.updateRecord("vehicle_tiers", t.id, payload));
      } else {
        saved.push(await pocketbaseAdmin.createRecord("vehicle_tiers", payload));
      }
    }
    return json({
      tiers: saved.map((t, i) => toTierResponse(t, i))
    });
  }
  const rows = await loadTiers(bizId);
  const tiers = rows.length > 0 ? rows.map((t, i) => toTierResponse(t, i)) : DEFAULT_TIERS.map((t, i) => toTierResponse(t, i));
  return json({
    tiers
  });
});
const route15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$c
}, Symbol.toStringTag, { value: "Module" }));
const loader$8 = withApi(async ({
  request
}) => {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const appId = process.env.SQUARE_APP_ID;
  const configured = Boolean(accessToken && locationId && appId);
  let paymentsLive = false;
  if (configured) {
    const base = process.env.SQUARE_ENVIRONMENT === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
    try {
      const res = await fetch(`${base}/v2/locations`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        signal: request.signal
      });
      if (res.ok) {
        const data2 = await res.json();
        const locations = data2.locations ?? [];
        paymentsLive = locations.some((l) => l.id === locationId);
      }
    } catch (err) {
      logger.error("payment-status: square locations check failed", String(err));
    }
  }
  return json({
    paymentsLive,
    squareConfigured: configured,
    needsConfiguration: !paymentsLive
  }, {
    headers: {
      "Cache-Control": "public, max-age=30"
    }
  });
});
const route16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
function visitorIp(request) {
  const [forwarded] = request.headers.get("x-forwarded-for")?.split(",") ?? [];
  const address = forwarded?.trim() || request.headers.get("x-real-ip")?.trim() || "";
  return address;
}
function isPublicIp(address) {
  if (!address) return false;
  try {
    const parsed = ipaddr.parse(address);
    if (parsed instanceof ipaddr.IPv6 && parsed.isIPv4MappedAddress()) {
      return isPublicIp(parsed.toIPv4Address().toString());
    }
    return parsed.range() === "unicast";
  } catch {
    return false;
  }
}
function parseUserAgent(ua) {
  const u = ua || "";
  let browser = "Unknown";
  if (/edg\//i.test(u)) browser = "Edge";
  else if (/opr\/|opera/i.test(u)) browser = "Opera";
  else if (/chrome|crios/i.test(u)) browser = "Chrome";
  else if (/firefox|fxios/i.test(u)) browser = "Firefox";
  else if (/safari/i.test(u)) browser = "Safari";
  let os = "Unknown";
  if (/windows nt/i.test(u)) os = "Windows";
  else if (/iphone|ipad|ipod/i.test(u)) os = "iOS";
  else if (/mac os x|macintosh/i.test(u)) os = "macOS";
  else if (/android/i.test(u)) os = "Android";
  else if (/linux/i.test(u)) os = "Linux";
  const device = /ipad|tablet|playbook|silk/i.test(u) ? "Tablet" : /mobile|iphone|ipod|android.*mobile|blackberry|opera mini|windows phone/i.test(u) ? "Mobile" : "Desktop";
  return { browser, device, os };
}
const GEO_CACHE = /* @__PURE__ */ new Map();
const GEO_TTL_MS = 30 * 60 * 1e3;
const GEO_TIMEOUT_MS = 2500;
async function geolocate(ip) {
  if (!isPublicIp(ip)) return null;
  const cached2 = GEO_CACHE.get(ip);
  if (cached2 && Date.now() - cached2.ts < GEO_TTL_MS) return cached2.info;
  let info = null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });
    clearTimeout(timer);
    if (res.ok) {
      const data2 = await res.json();
      if (!data2.error) {
        info = {
          city: (data2.city || "").trim(),
          region: (data2.region || "").trim(),
          countryName: (data2.country_name || "").trim(),
          countryCode: (data2.country || "").trim().toUpperCase()
        };
      }
    }
  } catch (err) {
    logger.info(`geo-IP lookup failed for ${ip}: ${err instanceof Error ? err.message : "unknown"}`);
  }
  GEO_CACHE.set(ip, { info, ts: Date.now() });
  return info;
}
function locationLabel(g) {
  if (!g) return "";
  const parts = [g.city, g.region, g.countryCode].filter(Boolean);
  return parts.join(", ");
}
async function getVisitorInfo(request) {
  const ip = visitorIp(request);
  const { browser, device, os } = parseUserAgent(request.headers.get("user-agent") || "");
  const geo = await geolocate(ip);
  const location = locationLabel(geo);
  return {
    ip,
    browser,
    device,
    os,
    location,
    city: geo?.city ?? "",
    region: geo?.region ?? "",
    countryName: geo?.countryName ?? "",
    countryCode: geo?.countryCode ?? "",
    locationApprox: Boolean(location)
  };
}
const MAX_EVENTS_PER_REQUEST = 100;
const MAX_LABEL = 300;
const MAX_TARGET = 200;
const MAX_PAGE = 300;
const MAX_SESSION = 60;
function normalizeBizId(raw) {
  const value = (raw ?? "").trim();
  return /^[a-z0-9]{15}$/.test(value) ? value : "";
}
function clip(value, max) {
  const s = String(value ?? "").slice(0, max);
  return s;
}
async function resolveCentralOperator(ownerId) {
  if (!ownerId) return "";
  try {
    const owner = await pocketbaseAdmin.getRecord("users", ownerId);
    const mb = owner.managedBy;
    const mbId = Array.isArray(mb) ? mb[0] || "" : mb ? String(mb) : "";
    if (mbId) return mbId;
  } catch {
  }
  try {
    const result = await pocketbaseAdmin.listRecords("users", {
      perPage: 1,
      sort: "created"
    });
    const primaryId = result.items[0]?.id ?? "";
    if (primaryId && primaryId !== ownerId) return primaryId;
  } catch {
  }
  return "";
}
const action$b = withApi(async ({
  request
}) => {
  const body = await readJsonBody(request);
  const bizId = normalizeBizId(body.biz);
  if (!bizId) return apiError(422, "Business id is required.");
  try {
    await pocketbaseAdmin.getRecord("users", bizId);
  } catch {
    return apiError(404, "Business not found.");
  }
  const rawEvents = Array.isArray(body.events) ? body.events : [];
  if (rawEvents.length === 0) return json({
    saved: 0
  });
  const events = rawEvents.slice(0, MAX_EVENTS_PER_REQUEST);
  const centralId = await resolveCentralOperator(bizId);
  const visitor = await getVisitorInfo(request);
  const records = events.map((e) => {
    const type = clip(e.type || "click", 40);
    const label = clip(e.label, MAX_LABEL).trim();
    if (!label) return null;
    return {
      type,
      label,
      target: clip(e.target, MAX_TARGET),
      page: clip(e.page, MAX_PAGE),
      session: clip(e.session, MAX_SESSION),
      meta: {
        ...e.meta ?? {},
        browser: visitor.browser,
        device: visitor.device,
        os: visitor.os,
        city: visitor.city,
        region: visitor.region,
        country: visitor.countryName,
        countryCode: visitor.countryCode,
        location: visitor.location,
        locationApprox: visitor.locationApprox
      },
      owner: bizId,
      centralOperator: centralId || ""
    };
  }).filter((r) => r !== null);
  if (records.length === 0) return json({
    saved: 0
  });
  try {
    let saved = 0;
    for (const r of records) {
      try {
        await pocketbaseAdmin.createRecord("activity_events", r);
        saved++;
      } catch {
      }
    }
    return json({
      saved
    });
  } catch {
    return json({
      saved: 0
    });
  }
});
const route17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$b
}, Symbol.toStringTag, { value: "Module" }));
const UA$1 = "BJKLimoRideBook/1.0 (ride-booking; contact@bjklimo.local)";
async function resolvePlace(address, key, signal) {
  const trimmed = address.trim();
  if (!trimmed) return null;
  const intent = parseAddressIntent(trimmed);
  const streetLike = isStreetQuery(intent);
  if (streetLike) {
    const street = await lookupStreetAddress(trimmed, signal);
    if (street) {
      return {
        lat: street.lat,
        lng: street.lng,
        label: street.formattedAddress,
        source: street.source
      };
    }
  }
  const airport = findAirportByCode(trimmed) ?? findAirportByCode(trimmed.split(/[\s,–-]+/)[0] ?? "") ?? matchAirportInText(trimmed);
  if (airport) {
    return {
      lat: airport.lat,
      lng: airport.lng,
      label: `${airport.code} — ${airport.name}, ${airport.city}`,
      source: "airport-db"
    };
  }
  if (key) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&key=${key}`,
        { signal }
      );
      if (res.ok) {
        const data2 = await res.json();
        const result = data2.results?.[0];
        const loc = result?.geometry?.location;
        const state = result?.address_components?.find((c) => c.types?.includes("administrative_area_level_1"))?.short_name;
        if (data2.status === "OK" && loc && isServiceState(state) && (!streetLike || houseNumberInText(result?.formatted_address ?? "", intent.house))) {
          return {
            lat: loc.lat,
            lng: loc.lng,
            label: result?.formatted_address ?? trimmed,
            source: "google"
          };
        }
      }
    } catch {
    }
  }
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=1`,
      { signal, headers: { "User-Agent": UA$1 } }
    );
    if (res.ok) {
      const data2 = await res.json();
      for (const f of data2.features ?? []) {
        const coords = f?.geometry?.coordinates;
        const p = f?.properties;
        if (!coords || coords.length < 2 || !serviceStateAbbr(p?.state)) continue;
        const streetLine = [p?.housenumber, p?.street].filter(Boolean).join(" ");
        const labelParts = [streetLine || p?.name, p?.city, p?.state, p?.country].filter(Boolean);
        const labelText = labelParts.join(", ");
        if (streetLike && !houseNumberInText(labelText, intent.house)) continue;
        return {
          lng: coords[0],
          lat: coords[1],
          label: labelText || trimmed,
          source: "photon"
        };
      }
    }
  } catch {
  }
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`,
      { signal }
    );
    if (res.ok) {
      const data2 = await res.json();
      const r = data2.results?.find(
        (item) => typeof item.latitude === "number" && serviceStateAbbr(item.admin1)
      );
      if (r) {
        const parts = [r.name, r.admin1, r.country].filter(Boolean);
        return {
          lat: r.latitude,
          lng: r.longitude,
          label: parts.join(", ") || trimmed,
          source: "open-meteo"
        };
      }
    }
  } catch {
  }
  return null;
}
function matchAirportInText(text) {
  const upper = text.toUpperCase();
  const codeMatch = upper.match(/\b([A-Z]{3})\b/);
  if (codeMatch) {
    const hit = findAirportByCode(codeMatch[1]);
    if (hit) return hit;
  }
  const lower = text.toLowerCase();
  return serviceAreaAirports.find(
    (a) => lower.includes(a.name.toLowerCase()) || lower.includes(`${a.city.toLowerCase()} airport`) || lower.includes(a.code.toLowerCase())
  );
}
async function fetchDrivingRoute(points, key, signal) {
  if (points.length < 2) return null;
  if (key) {
    try {
      const origin = `${points[0].lat},${points[0].lng}`;
      const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
      const mids = points.slice(1, -1);
      const waypointPart = mids.length > 0 ? `&waypoints=${encodeURIComponent(mids.map((p) => `${p.lat},${p.lng}`).join("|"))}` : "";
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypointPart}&extra_computations=tolls&key=${key}`,
        { signal }
      );
      if (res.ok) {
        const data2 = await res.json();
        const route = data2.routes?.[0];
        const encoded = route?.overview_polyline?.points;
        if (data2.status === "OK" && encoded) {
          const decoded = decodePolyline(encoded);
          const legs = route?.legs ?? [];
          const distanceMeters2 = legs.reduce((s, l) => s + (l.distance?.value ?? 0), 0);
          const durationSeconds = legs.reduce((s, l) => s + (l.duration?.value ?? 0), 0);
          let tolls = null;
          let tollCurrency = null;
          const prices = route?.travel_advisory?.tollData?.estimatedPrice ?? [];
          if (prices.length > 0) {
            let sum = 0;
            for (const p of prices) {
              const units = Number(p.units ?? 0);
              const nanos = Number(p.nanos ?? 0) / 1e9;
              sum += units + nanos;
              if (p.currencyCode) tollCurrency = p.currencyCode;
            }
            tolls = Math.round(sum * 100) / 100;
          }
          if (decoded.length >= 2) {
            return { polyline: decoded, distanceMeters: distanceMeters2, durationSeconds, source: "google", tolls, tollCurrency };
          }
        }
      }
    } catch {
    }
  }
  try {
    const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
      { signal, headers: { "User-Agent": UA$1 } }
    );
    if (res.ok) {
      const data2 = await res.json();
      const route = data2.routes?.[0];
      const raw = route?.geometry?.coordinates;
      if (data2.code === "Ok" && raw && raw.length >= 2) {
        const polyline2 = simplify(
          raw.map(([lng, lat]) => [lat, lng]),
          400
        );
        return {
          polyline: polyline2,
          distanceMeters: route?.distance ?? 0,
          durationSeconds: route?.duration ?? 0,
          source: "osrm",
          tolls: null,
          tollCurrency: null
        };
      }
    }
  } catch {
  }
  const polyline = points.map((p) => [p.lat, p.lng]);
  let distanceMeters = 0;
  for (let i = 1; i < points.length; i++) {
    distanceMeters += haversineMiles(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng) * 1609.344;
  }
  return {
    polyline,
    distanceMeters,
    durationSeconds: 0,
    source: "straight",
    tolls: null,
    tollCurrency: null
  };
}
function decodePolyline(encoded) {
  const coordinates = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coordinates.push([lat / 1e5, lng / 1e5]);
  }
  return simplify(coordinates, 400);
}
function simplify(points, max) {
  if (points.length <= max) return points;
  const out = [points[0]];
  const step = (points.length - 1) / (max - 1);
  for (let i = 1; i < max - 1; i++) {
    out.push(points[Math.round(i * step)]);
  }
  out.push(points[points.length - 1]);
  return out;
}
function resolveTip(body) {
  const kind = body.tipKind;
  if (kind === "none") return {
    kind: "none",
    percent: 0,
    amount: 0
  };
  if (kind === "amount") {
    const amount = Number(body.tipAmount);
    if (!Number.isFinite(amount) || amount < 0) return {
      kind: "none",
      percent: 0,
      amount: 0
    };
    return {
      kind: "amount",
      percent: 0,
      amount: Math.round(amount * 100) / 100
    };
  }
  if (kind === "percent") {
    const percent = Number(body.tipPercent);
    if (!Number.isFinite(percent) || percent < 0) return {
      kind: "none",
      percent: 0,
      amount: 0
    };
    return {
      kind: "percent",
      percent: Math.min(100, percent),
      amount: 0
    };
  }
  return void 0;
}
const action$a = withApi(async ({
  request
}) => {
  const body = await readJsonBody(request);
  const service = body.service === "ride" ? "ride" : body.service === "hourly" ? "hourly" : "";
  if (!service) {
    return apiError(422, 'service must be "ride" or "hourly"');
  }
  const resolvedBizId = await resolveBusinessId(body.biz);
  const {
    pricing,
    tiers
  } = await loadBusinessPricing(resolvedBizId);
  const tipOverride = resolveTip(body);
  const addons = {
    carSeat: body.carSeat === true,
    insidePickup: body.insidePickup === true,
    extraStop: body.extraStop === true
  };
  const tier = tiers.find((t) => t.active && t.key === (body.vehicle ?? ""));
  if (!tier) {
    return apiError(422, "unknown vehicle category");
  }
  if (service === "hourly") {
    const hours = Number(body.hours);
    if (!Number.isFinite(hours) || hours < 2 || hours > 12) {
      return apiError(422, "hours must be between 2 and 12");
    }
    const subtotal2 = estimateHourlyFare(pricing, hours, tier);
    const breakdown2 = buildFareBreakdown(pricing, subtotal2, 0, tipOverride, addons);
    const tierFares2 = tiers.filter((t) => t.active).map((t) => {
      const tSub = estimateHourlyFare(pricing, hours, t);
      const tBd = buildFareBreakdown(pricing, tSub, 0, tipOverride, addons);
      return {
        key: t.key,
        name: t.name,
        fare: tBd.total,
        fareText: formatFare(tBd.total, pricing.currency),
        subtotal: tBd.subtotal,
        tollAmount: tBd.tollAmount,
        tipAmount: tBd.tipAmount,
        taxAmount: tBd.taxAmount,
        carSeatAmount: tBd.carSeatAmount,
        extraStopAmount: tBd.extraStopAmount,
        insidePickupAmount: tBd.insidePickupAmount,
        tollsAvailable: true
      };
    });
    return json({
      ok: true,
      fare: breakdown2.total,
      subtotal: breakdown2.subtotal,
      tollAmount: breakdown2.tollAmount,
      tipAmount: breakdown2.tipAmount,
      taxAmount: breakdown2.taxAmount,
      carSeatAmount: breakdown2.carSeatAmount,
      extraStopAmount: breakdown2.extraStopAmount,
      insidePickupAmount: breakdown2.insidePickupAmount,
      fareText: formatFare(breakdown2.total, pricing.currency),
      tierName: tier.name,
      roundTrip: false,
      tollsAvailable: true,
      tierFares: tierFares2
    });
  }
  const coord = (c) => {
    if (!c || typeof c.lat !== "number" || typeof c.lng !== "number") return null;
    if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) return null;
    if (Math.abs(c.lat) > 90 || Math.abs(c.lng) > 180) return null;
    return {
      lat: c.lat,
      lng: c.lng
    };
  };
  const pickup = coord(body.pickupCoords);
  const dropoff = coord(body.dropoffCoords);
  const stop = coord(body.extraStopCoords);
  if (!pickup || !dropoff) {
    return apiError(422, "verified pickup and dropoff coordinates are required to calculate an exact fare");
  }
  const points = [pickup, ...stop ? [stop] : [], dropoff];
  const route = await fetchDrivingRoute(points, process.env.GOOGLE_MAPS_API_KEY, request.signal);
  if (!route || route.source === "straight" || !(route.distanceMeters > 0)) {
    return json({
      ok: false,
      message: "We couldn’t calculate the exact driving distance right now. Please try again in a moment."
    });
  }
  const roundTrip = body.returnTrip === true;
  let miles = route.distanceMeters / 1609.344;
  let durationSeconds = route.durationSeconds;
  let tolls = route.tolls ?? null;
  if (roundTrip) {
    miles *= 2;
    durationSeconds *= 2;
    if (tolls !== null) tolls *= 2;
  }
  const subtotal = estimateRideFare(pricing, miles, tier);
  const tollsAvailable = !pricing.tollsEnabled || tolls !== null;
  const tollsForBreakdown = pricing.tollsEnabled ? tolls ?? 0 : 0;
  const breakdown = buildFareBreakdown(pricing, subtotal, tollsForBreakdown, tipOverride, addons);
  const tierFares = tiers.filter((t) => t.active).map((t) => {
    const tSub = estimateRideFare(pricing, miles, t);
    const tBd = buildFareBreakdown(pricing, tSub, tollsForBreakdown, tipOverride, addons);
    return {
      key: t.key,
      name: t.name,
      fare: tBd.total,
      fareText: formatFare(tBd.total, pricing.currency),
      subtotal: tBd.subtotal,
      tollAmount: tBd.tollAmount,
      tipAmount: tBd.tipAmount,
      taxAmount: tBd.taxAmount,
      carSeatAmount: tBd.carSeatAmount,
      extraStopAmount: tBd.extraStopAmount,
      insidePickupAmount: tBd.insidePickupAmount,
      tollsAvailable,
      miles,
      distanceText: `${miles.toFixed(1)} mi${roundTrip ? " round trip" : ""}`,
      durationText: durationSeconds > 0 ? `~${Math.max(1, Math.round(durationSeconds / 60))} min` : ""
    };
  });
  return json({
    ok: true,
    fare: breakdown.total,
    subtotal: breakdown.subtotal,
    tollAmount: breakdown.tollAmount,
    tipAmount: breakdown.tipAmount,
    taxAmount: breakdown.taxAmount,
    carSeatAmount: breakdown.carSeatAmount,
    extraStopAmount: breakdown.extraStopAmount,
    insidePickupAmount: breakdown.insidePickupAmount,
    miles,
    roundTrip,
    fareText: formatFare(breakdown.total, pricing.currency),
    distanceText: `${miles.toFixed(1)} mi${roundTrip ? " round trip" : ""}`,
    durationText: durationSeconds > 0 ? `~${Math.max(1, Math.round(durationSeconds / 60))} min` : "",
    tierName: tier.name,
    tollsAvailable,
    tierFares
  });
});
const route18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$a
}, Symbol.toStringTag, { value: "Module" }));
const PB_URL$2 = () => process.env.POCKETBASE_URL || "http://localhost:8090";
function decodePayload$1(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
function normalizeE164Phone(raw) {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) {
    return "+" + trimmed.replace(/[^\d]/g, "");
  }
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}
async function dispatchAutomatedCustomerSms(params) {
  const normalizedPhone = normalizeE164Phone(params.toPhone);
  if (!normalizedPhone) {
    return {
      deliveredViaGateway: false,
      normalizedPhone: ""
    };
  }
  let deliveredViaGateway = false;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const form = new URLSearchParams();
      form.set("To", normalizedPhone);
      form.set("From", twilioFrom);
      form.set("Body", params.message);
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(twilioSid)}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: form.toString()
      });
      if (res.ok) deliveredViaGateway = true;
    } catch {
    }
  }
  const webhookUrl = process.env.SMS_WEBHOOK_URL;
  if (webhookUrl && !deliveredViaGateway) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: normalizedPhone,
          message: params.message,
          customerName: params.customerName,
          tripId: params.tripId,
          status: params.status
        })
      });
      if (res.ok) deliveredViaGateway = true;
    } catch {
    }
  }
  const textbeltKey = process.env.TEXTBELT_API_KEY;
  if (textbeltKey && !deliveredViaGateway) {
    try {
      const res = await fetch("https://textbelt.com/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          message: params.message,
          key: textbeltKey
        })
      });
      if (res.ok) deliveredViaGateway = true;
    } catch {
    }
  }
  return {
    deliveredViaGateway,
    normalizedPhone
  };
}
async function verifyCaller$1(authHeader) {
  if (!authHeader) throw apiError(401, "Authentication required.");
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw apiError(401, "Authentication required.");
  const payload = decodePayload$1(token);
  const callerId = payload?.id;
  if (!callerId) throw apiError(401, "Invalid session token.");
  const client = new PocketBase(PB_URL$2());
  client.autoCancellation(false);
  client.authStore.save(token, null);
  try {
    const d = await client.collection("drivers").getOne(callerId);
    return {
      id: d.id,
      name: d.name || d.email || "Driver",
      email: d.email || "",
      isDriver: true,
      isOperator: false
    };
  } catch {
  }
  try {
    const u = await client.collection("users").getOne(callerId);
    return {
      id: u.id,
      name: u.name || u.email || "Operator",
      email: u.email || "",
      isDriver: false,
      isOperator: true
    };
  } catch {
    throw apiError(401, "Session expired or user not found.");
  }
}
const action$9 = withApi(async ({
  request
}) => {
  const caller = await verifyCaller$1(request.headers.get("Authorization"));
  const body = await readJsonBody(request);
  const tripId = (body.tripId || "").trim();
  if (!tripId) return apiError(422, "tripId is required.");
  let trip;
  try {
    trip = await pocketbaseAdmin.getRecord("reservations", tripId);
  } catch {
    return apiError(404, "Reservation not found.");
  }
  if (caller.isDriver && trip.driver && trip.driver !== caller.id) {
    return apiError(403, "This trip is not assigned to you.");
  }
  const patch = {};
  let activityLabel = "";
  let automatedSmsText = "";
  const guestName = trip.name || "Guest";
  const pickupMs = trip.pickupAt ? new Date(trip.pickupAt).getTime() : NaN;
  const minutesUntilPickup = Number.isNaN(pickupMs) ? null : (pickupMs - Date.now()) / 6e4;
  switch (body.action) {
    case "accept":
    case "on_the_way":
      if (minutesUntilPickup !== null && minutesUntilPickup > 60) {
        return apiError(422, 'The "On the Way" status can only be updated starting 1 hour (60 minutes) before the pickup time.');
      }
      patch.driverStatus = "on_the_way";
      if (!trip.status || trip.status === "pending") {
        patch.status = "confirmed";
      }
      if (!trip.driver && caller.isDriver) {
        patch.driver = caller.id;
      }
      automatedSmsText = "Your driver is on the way.";
      activityLabel = `Driver ${caller.name} status set to On the Way for ${guestName} — Automated SMS sent: "${automatedSmsText}"`;
      break;
    case "arrive":
      if (minutesUntilPickup !== null && minutesUntilPickup > 25) {
        return apiError(422, 'The "Arrived" status can only be updated within the final 25 minutes before the pickup time.');
      }
      patch.driverStatus = "arrived";
      automatedSmsText = "Your driver has arrived.";
      activityLabel = `Driver ${caller.name} arrived at pickup location for ${guestName} — Automated SMS sent: "${automatedSmsText}"`;
      break;
    case "pickup":
      patch.driverStatus = "on_board";
      activityLabel = `Driver ${caller.name} picked up passenger ${guestName}`;
      break;
    case "dropoff":
      patch.driverStatus = "dropped_off";
      patch.status = "completed";
      activityLabel = `Driver ${caller.name} dropped off passenger ${guestName} (Trip Completed)`;
      break;
    case "note":
      break;
    default:
      if (!body.note) {
        return apiError(422, "Valid action (on_the_way, accept, arrive, pickup, dropoff, note) is required.");
      }
  }
  if (typeof body.note === "string") {
    const cleanNote = body.note.trim();
    patch.driverNotes = cleanNote;
    if (body.action === "note" && cleanNote) {
      activityLabel = `Driver ${caller.name} added trip note: “${cleanNote.slice(0, 80)}”`;
    }
  }
  let updatedRecord;
  try {
    updatedRecord = await pocketbaseAdmin.updateRecord("reservations", tripId, patch);
  } catch {
    const fallbackPatch = {};
    if (patch.status) fallbackPatch.status = patch.status;
    if (patch.driver) fallbackPatch.driver = patch.driver;
    if (patch.driverNotes || patch.driverStatus) {
      const stamp = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
      });
      const statusNote = patch.driverStatus ? `[Status: ${patch.driverStatus} at ${stamp}]` : "";
      const contentNote = patch.driverNotes ? `[Driver Note: ${patch.driverNotes}]` : "";
      const existing = trip.notes || "";
      fallbackPatch.notes = `${existing}
${statusNote} ${contentNote}`.trim();
    }
    updatedRecord = await pocketbaseAdmin.updateRecord("reservations", tripId, fallbackPatch);
  }
  let smsNotification = null;
  if (automatedSmsText) {
    const smsResult = await dispatchAutomatedCustomerSms({
      toPhone: trip.phone,
      customerName: guestName,
      message: automatedSmsText,
      tripId,
      status: String(patch.driverStatus || "")
    });
    smsNotification = {
      sent: true,
      to: trip.phone || smsResult.normalizedPhone || "Customer",
      customerName: guestName,
      status: String(patch.driverStatus || ""),
      message: automatedSmsText,
      sentAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  if (activityLabel) {
    try {
      await pocketbaseAdmin.createRecord("activity_events", {
        type: "driver_update",
        label: activityLabel,
        target: tripId,
        page: "/driver",
        owner: trip.owner || ""
      });
    } catch {
    }
  }
  return json({
    ok: true,
    trip: updatedRecord,
    smsNotification
  });
});
const route19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$9
}, Symbol.toStringTag, { value: "Module" }));
function decodePayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
function extractToken(request) {
  const auth = request.headers.get("Authorization") || request.headers.get("authorization") || "";
  if (auth) {
    const clean = auth.replace(/^Bearer\s+/i, "").trim();
    if (clean) return clean;
  }
  const cookie = request.headers.get("cookie") || request.headers.get("Cookie") || "";
  const match = cookie.match(/pb_auth=([^;]+)/);
  if (match) {
    try {
      const parsed = JSON.parse(decodeURIComponent(match[1]));
      if (parsed?.token) return parsed.token;
    } catch {
    }
  }
  return "";
}
async function verifyCaller(request) {
  const token = extractToken(request);
  if (!token) throw apiError(401, "Authentication required.");
  const payload = decodePayload(token);
  const callerId = payload?.id;
  if (!callerId) throw apiError(401, "Invalid session token.");
  try {
    await pocketbaseAdmin.getRecord("users", callerId);
    return {
      id: callerId,
      isDriver: false,
      isOperator: true
    };
  } catch {
  }
  try {
    await pocketbaseAdmin.getRecord("drivers", callerId);
    return {
      id: callerId,
      isDriver: true,
      isOperator: false
    };
  } catch {
    throw apiError(401, "Session expired or user not found.");
  }
}
const loader$7 = withApi(async ({
  request
}) => {
  await verifyCaller(request);
  let drivers = [];
  try {
    const list = await pocketbaseAdmin.listRecords("drivers", {
      perPage: 100,
      sort: "name"
    });
    drivers = list.items;
  } catch (err) {
    return json({
      ok: false,
      drivers: [],
      error: "Could not load drivers."
    });
  }
  let activeReservations = [];
  try {
    const resList = await pocketbaseAdmin.listRecords("reservations", {
      perPage: 200,
      sort: "pickupAt",
      filter: 'status != "cancelled" && status != "no_show"'
    });
    activeReservations = resList.items;
  } catch {
  }
  const enrichedDrivers = drivers.map((d) => {
    const assigned = activeReservations.filter((r) => r.driver === d.id);
    const activeTrip = assigned.find((r) => r.driverStatus === "on_board" || r.driverStatus === "arrived" || r.driverStatus === "on_the_way" || r.driverStatus === "accepted") || assigned.find((r) => r.status === "confirmed" || r.status === "pending") || assigned[0] || null;
    const hasLiveGps = typeof d.lat === "number" && typeof d.lng === "number" && Boolean(d.lastLocationUpdate);
    return {
      id: d.id,
      name: d.name || d.email || "Chauffeur",
      email: d.email,
      phone: d.phone,
      vehicle: d.vehicle || "sedan",
      active: d.active !== false,
      onDuty: d.onDuty !== false,
      lat: typeof d.lat === "number" ? d.lat : null,
      lng: typeof d.lng === "number" ? d.lng : null,
      defaultLat: 40.8501,
      // Teterboro Fleet Base
      defaultLng: -74.0608,
      hasLiveGps,
      heading: typeof d.heading === "number" ? d.heading : 0,
      speed: typeof d.speed === "number" ? d.speed : 0,
      lastLocationUpdate: d.lastLocationUpdate || null,
      activeTrip: activeTrip ? {
        id: activeTrip.id,
        passengerName: activeTrip.name || "Guest",
        phone: activeTrip.phone || "",
        pickup: activeTrip.pickup || "",
        dropoff: activeTrip.dropoff || "",
        extraStop: activeTrip.extraStop || "",
        pickupAt: activeTrip.pickupAt || "",
        driverStatus: activeTrip.driverStatus || "assigned",
        status: activeTrip.status || "pending",
        sourceName: activeTrip.sourceName || "",
        flight: activeTrip.flight || "",
        vehicle: activeTrip.vehicle || ""
      } : null
    };
  });
  return json({
    ok: true,
    drivers: enrichedDrivers,
    timestamp: Date.now()
  });
});
const action$8 = withApi(async ({
  request
}) => {
  const caller = await verifyCaller(request);
  const body = await readJsonBody(request);
  const targetDriverId = caller.isOperator && body.driverId ? body.driverId : caller.id;
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return apiError(422, "Valid lat between -90 and 90 is required.");
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return apiError(422, "Valid lng between -180 and 180 is required.");
  }
  const patch = {
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
    lastLocationUpdate: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (typeof body.heading === "number") patch.heading = Math.round(body.heading);
  if (typeof body.speed === "number") patch.speed = Math.max(0, Math.round(body.speed * 10) / 10);
  if (typeof body.onDuty === "boolean") patch.onDuty = body.onDuty;
  if (body.tripId) patch.currentTripId = body.tripId;
  try {
    await pocketbaseAdmin.updateRecord("drivers", targetDriverId, patch);
  } catch (err) {
    return json({
      ok: false,
      warning: "Failed to write GPS fields to database."
    });
  }
  return json({
    ok: true,
    timestamp: Date.now()
  });
});
const route20 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$8,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
async function verifySquarePayment(reservationId) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!accessToken || !locationId) {
    return {
      verified: false,
      configured: false
    };
  }
  const base = process.env.SQUARE_ENVIRONMENT === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
  try {
    const res = await fetch(`${base}/v2/orders/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": "2024-12-18",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        location_ids: [locationId],
        query: {
          filter: {
            reference_ids: {
              reference_ids: [reservationId]
            },
            state_filter: {
              states: ["COMPLETED"]
            }
          }
        }
      })
    });
    if (!res.ok) {
      logger.error("payment-complete: square order search failed", `${res.status} ${res.statusText}`);
      return {
        verified: false,
        configured: true
      };
    }
    const data2 = await res.json();
    const orders = data2.orders ?? [];
    if (orders.length > 0) {
      return {
        verified: true,
        configured: true,
        orderId: orders[0].id
      };
    }
    return {
      verified: false,
      configured: true
    };
  } catch (err) {
    logger.error("payment-complete: square order search failed", String(err));
    return {
      verified: false,
      configured: true
    };
  }
}
const action$7 = withApi(async ({
  request
}) => {
  const {
    ref
  } = await readJsonBody(request);
  const id = (ref ?? "").trim();
  if (!/^[a-z0-9]{15}$/.test(id)) {
    return apiError(422, "a valid reservation reference is required");
  }
  const {
    verified,
    configured,
    orderId
  } = await verifySquarePayment(id);
  if (!configured) {
    return json({
      ok: false,
      needsConfiguration: true
    });
  }
  if (!verified) {
    return json({
      ok: false,
      pending: true
    });
  }
  try {
    await pocketbaseAdmin.updateRecord("reservations", id, {
      paid: true,
      captured: true,
      status: "confirmed",
      ...orderId ? {
        squareOrderId: orderId
      } : {}
    });
  } catch (err) {
    const status = err?.status;
    if (status === 404) {
      return apiError(404, "reservation not found");
    }
    logger.error("payment-complete: failed to mark reservation paid", String(err));
    throw err;
  }
  logger.info("payment-complete: reservation verified and marked paid", id);
  return json({
    ok: true
  });
});
const route21 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$7
}, Symbol.toStringTag, { value: "Module" }));
const action$6 = withApi(async ({
  request
}) => {
  const {
    ref
  } = await readJsonBody(request);
  const id = (ref ?? "").trim();
  if (!/^[a-z0-9]{15}$/.test(id)) {
    return apiError(422, "a valid reservation reference is required");
  }
  try {
    const reservation = await pocketbaseAdmin.getRecord("reservations", id);
    if (reservation?.paid) {
      return json({
        ok: true,
        alreadyPaid: true
      });
    }
    await pocketbaseAdmin.deleteRecord("reservations", id);
  } catch (err) {
    const status = err?.status;
    if (status === 404) {
      return json({
        ok: true,
        notFound: true
      });
    }
    logger.error("payment-abandon: failed to delete pending reservation", String(err));
    throw err;
  }
  logger.info("payment-abandon: deleted unpaid pending reservation", id);
  return json({
    ok: true
  });
});
const route22 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6
}, Symbol.toStringTag, { value: "Module" }));
const W = 640;
const H = 360;
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function truncate(s, max = 36) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
function project(points) {
  const pad = 56;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;
  const span = Math.max(latRange, lngRange);
  return points.map((p) => ({
    x: pad + (p.lng - minLng) / lngRange * (W - pad * 2) * (lngRange / span),
    y: H - pad - (p.lat - minLat) / latRange * (H - pad * 2) * (latRange / span)
  }));
}
function svgRoute(labels, polyline, markerIdx, distanceNote, isFallback) {
  const pts = project(polyline.map(([lat, lng]) => ({
    lat,
    lng
  })));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const markerMeta = [{
    key: "A",
    color: "#255dc4",
    shape: "circle"
  }, {
    key: "B",
    color: "#202b41",
    shape: "square"
  }];
  if (labels.length === 3) {
    markerMeta.splice(1, 0, {
      key: "S",
      color: "#2f8f6b",
      shape: "circle"
    });
  }
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#eef3fb"/>`;
  for (let gx = 40; gx < W; gx += 50) {
    svg += `<line x1="${gx}" y1="0" x2="${gx}" y2="${H}" stroke="#e0e8f4" stroke-width="1"/>`;
  }
  for (let gy = 40; gy < H; gy += 50) {
    svg += `<line x1="0" y1="${gy}" x2="${W}" y2="${gy}" stroke="#e0e8f4" stroke-width="1"/>`;
  }
  svg += `<path d="${pathD}" fill="none" stroke="#9db9e8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>`;
  svg += `<path d="${pathD}" fill="none" stroke="#255dc4" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"${isFallback ? ' stroke-dasharray="8 6"' : ""}/>`;
  markerIdx.forEach((pi, i) => {
    const p = pts[pi];
    const m = markerMeta[i];
    if (!p || !m) return;
    if (m.shape === "square") {
      svg += `<rect x="${(p.x - 11).toFixed(1)}" y="${(p.y - 11).toFixed(1)}" width="22" height="22" rx="4" fill="${m.color}" stroke="#fff" stroke-width="2"/>`;
    } else {
      svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="11" fill="${m.color}" stroke="#fff" stroke-width="2"/>`;
    }
    svg += `<text x="${p.x.toFixed(1)}" y="${(p.y + 4).toFixed(1)}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="700" fill="#fff">${m.key}</text>`;
    const ly = Math.min(H - 28, p.y + 28);
    svg += `<text x="${p.x.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="11" font-weight="700" fill="#202b41">${esc(truncate(labels[i] ?? ""))}</text>`;
  });
  svg += `<text x="${W / 2}" y="${H - 14}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#5c687b">${esc(distanceNote)}</text>`;
  svg += `</svg>`;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300"
    }
  });
}
const loader$6 = withApi(async ({
  request
}) => {
  const url = new URL(request.url);
  const origin = (url.searchParams.get("origin") ?? "").trim();
  const destination = (url.searchParams.get("destination") ?? "").trim();
  const waypoint = (url.searchParams.get("waypoint") ?? "").trim();
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!origin || !destination) {
    return apiError(422, "origin and destination query params are required");
  }
  const [originPlace, destPlace, stopPlace] = await Promise.all([resolvePlace(origin, key, request.signal), resolvePlace(destination, key, request.signal), waypoint ? resolvePlace(waypoint, key, request.signal) : Promise.resolve(null)]);
  if (!originPlace || !destPlace) {
    const msg = "Map unavailable — could not locate these addresses";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="220" viewBox="0 0 ${W} 220"><rect width="${W}" height="220" fill="#f3f7fe"/><text x="320" y="112" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#7d899c">${esc(msg)}</text></svg>`;
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=60"
      }
    });
  }
  const points = [originPlace, ...stopPlace ? [stopPlace] : [], destPlace];
  const route = await fetchDrivingRoute(points, key, request.signal);
  const polyline = route?.polyline ?? points.map((p) => [p.lat, p.lng]);
  if (key && route?.source === "google") {
    try {
      const pathPts = polyline.filter((_, i) => i % Math.ceil(polyline.length / 80) === 0 || i === polyline.length - 1).map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join("|");
      let mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=${W}x${H}&scale=2&maptype=roadmap`;
      mapUrl += `&path=color:0x255dc4ff%7Cweight:4%7C${pathPts}`;
      mapUrl += `&markers=color:0x255dc4%7Clabel:A%7C${originPlace.lat},${originPlace.lng}`;
      if (stopPlace) mapUrl += `&markers=color:0x2f8f6b%7Clabel:S%7C${stopPlace.lat},${stopPlace.lng}`;
      mapUrl += `&markers=color:0x202b41%7Clabel:B%7C${destPlace.lat},${destPlace.lng}`;
      mapUrl += `&key=${key}`;
      const mapRes = await fetch(mapUrl, {
        signal: request.signal
      });
      if (mapRes.ok) {
        const buffer = await mapRes.arrayBuffer();
        return new Response(buffer, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=300"
          }
        });
      }
    } catch {
    }
  }
  const labels = stopPlace ? [originPlace.label || origin, stopPlace.label || waypoint, destPlace.label || destination] : [originPlace.label || origin, destPlace.label || destination];
  const markerIdx = [0];
  if (stopPlace && polyline.length > 2) {
    let best = 1;
    let bestD = Infinity;
    for (let i = 1; i < polyline.length - 1; i++) {
      const d = haversineMiles(polyline[i][0], polyline[i][1], stopPlace.lat, stopPlace.lng);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    markerIdx.push(best);
  }
  markerIdx.push(polyline.length - 1);
  const miles = (route?.distanceMeters ?? 0) / 1609.344;
  const mins = Math.round((route?.durationSeconds ?? 0) / 60);
  let note = "";
  if (miles > 0) {
    note = `≈ ${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
    if (mins > 0) note += ` · ~${mins} min drive`;
    if (route?.source === "straight") note += " (straight-line)";
  } else {
    note = "Route confirmed before pickup";
  }
  return svgRoute(labels, polyline, markerIdx, note, route?.source === "straight");
});
const route23 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
const loader$5 = withApi(async ({
  request
}) => {
  const url = new URL(request.url);
  const origin = (url.searchParams.get("origin") ?? "").trim();
  const destination = (url.searchParams.get("destination") ?? "").trim();
  const waypoint = (url.searchParams.get("waypoint") ?? "").trim();
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!origin || !destination) {
    return apiError(422, "origin and destination query params are required");
  }
  const num = (name) => {
    const raw = url.searchParams.get(name);
    if (raw === null || raw.trim() === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };
  const originLat = num("originLat");
  const originLng = num("originLng");
  const destLat = num("destinationLat");
  const destLng = num("destinationLng");
  const stopLat = num("waypointLat");
  const stopLng = num("waypointLng");
  const [originPlace, destPlace, stopPlace] = await Promise.all([originLat !== null && originLng !== null ? {
    lat: originLat,
    lng: originLng,
    label: origin,
    source: "selection"
  } : resolvePlace(origin, key, request.signal), destLat !== null && destLng !== null ? {
    lat: destLat,
    lng: destLng,
    label: destination,
    source: "selection"
  } : resolvePlace(destination, key, request.signal), waypoint ? stopLat !== null && stopLng !== null ? {
    lat: stopLat,
    lng: stopLng,
    label: waypoint,
    source: "selection"
  } : resolvePlace(waypoint, key, request.signal) : Promise.resolve(null)]);
  if (!originPlace || !destPlace) {
    return json({
      ok: false,
      error: "Could not locate one or both addresses on the map.",
      origin: originPlace,
      destination: destPlace,
      waypoint: stopPlace,
      polyline: [],
      distanceMeters: 0,
      durationSeconds: 0,
      source: null
    }, {
      headers: {
        "Cache-Control": "public, max-age=60"
      }
    });
  }
  const points = [originPlace, ...stopPlace ? [stopPlace] : [], destPlace];
  const route = await fetchDrivingRoute(points, key, request.signal);
  return json({
    ok: true,
    origin: originPlace,
    destination: destPlace,
    waypoint: stopPlace,
    polyline: route?.polyline ?? points.map((p) => [p.lat, p.lng]),
    distanceMeters: route?.distanceMeters ?? 0,
    durationSeconds: route?.durationSeconds ?? 0,
    source: route?.source ?? "straight"
  }, {
    headers: {
      "Cache-Control": "public, max-age=300"
    }
  });
});
const route24 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
const loader$4 = withApi(async ({
  request
}) => {
  const url = new URL(request.url);
  const origin = (url.searchParams.get("origin") ?? "").trim();
  const destination = (url.searchParams.get("destination") ?? "").trim();
  const waypoint = (url.searchParams.get("waypoint") ?? "").trim();
  const apiKey = process.env.HERE_TRAFFIC_API_KEY;
  if (!origin || !destination) {
    return apiError(422, "origin and destination query params are required");
  }
  if (!apiKey) {
    return json({
      available: false
    }, {
      headers: {
        "Cache-Control": "public, max-age=60"
      }
    });
  }
  const num = (name) => {
    const raw = url.searchParams.get(name);
    if (raw === null || raw.trim() === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };
  const originLat = num("originLat");
  const originLng = num("originLng");
  const destLat = num("destinationLat");
  const destLng = num("destinationLng");
  const stopLat = num("waypointLat");
  const stopLng = num("waypointLng");
  const [originPlace, destPlace, stopPlace] = await Promise.all([originLat !== null && originLng !== null ? {
    lat: originLat,
    lng: originLng,
    label: origin,
    source: "selection"
  } : resolvePlace(origin, void 0, request.signal), destLat !== null && destLng !== null ? {
    lat: destLat,
    lng: destLng,
    label: destination,
    source: "selection"
  } : resolvePlace(destination, void 0, request.signal), waypoint ? stopLat !== null && stopLng !== null ? {
    lat: stopLat,
    lng: stopLng,
    label: waypoint,
    source: "selection"
  } : resolvePlace(waypoint, void 0, request.signal) : Promise.resolve(null)]);
  if (!originPlace || !destPlace) {
    return json({
      available: false
    }, {
      headers: {
        "Cache-Control": "public, max-age=60"
      }
    });
  }
  const points = [originPlace, ...stopPlace ? [stopPlace] : [], destPlace];
  const route = await fetchDrivingRoute(points, void 0, request.signal);
  const polyline = route?.polyline;
  if (!polyline || polyline.length < 2) {
    return json({
      available: false
    }, {
      headers: {
        "Cache-Control": "public, max-age=60"
      }
    });
  }
  const lats = polyline.map((p) => p[0]);
  const lngs = polyline.map((p) => p[1]);
  const padLat = 0.0135;
  const padLng = 0.018;
  const west = Math.min(...lngs) - padLng;
  const south = Math.min(...lats) - padLat;
  const east = Math.max(...lngs) + padLng;
  const north = Math.max(...lats) + padLat;
  const maxSpan = 1;
  const centerLat = (north + south) / 2;
  const centerLng = (east + west) / 2;
  const halfH = Math.min((north - south) / 2, maxSpan / 2);
  const halfW = Math.min((east - west) / 2, maxSpan / 2);
  const bbox = `${centerLng - halfW},${centerLat - halfH},${centerLng + halfW},${centerLat + halfH}`;
  try {
    const res = await fetch(`https://data.traffic.hereapi.com/v7/flow?locationReferencing=shape&in=bbox:${bbox}&apiKey=${encodeURIComponent(apiKey)}`, {
      signal: request.signal,
      headers: {
        Accept: "application/json"
      }
    });
    if (!res.ok) {
      return json({
        available: false
      }, {
        headers: {
          "Cache-Control": "public, max-age=60"
        }
      });
    }
    const data2 = await res.json();
    const segments = extractSegments(data2);
    if (segments.length === 0) {
      return json({
        available: false
      }, {
        headers: {
          "Cache-Control": "public, max-age=60"
        }
      });
    }
    return json({
      available: true,
      segments,
      updatedAt: Date.now()
    }, {
      headers: {
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch {
    return json({
      available: false
    }, {
      headers: {
        "Cache-Control": "public, max-age=60"
      }
    });
  }
});
function levelFor(jam) {
  if (jam >= 8) return "heavy";
  if (jam >= 4) return "slow";
  return "free";
}
function extractSegments(data2) {
  const out = [];
  for (const r of data2.results ?? []) {
    const jam = r.currentFlow?.jamFactor;
    if (typeof jam !== "number") continue;
    const shape = r.location?.shape;
    if (!shape) continue;
    if (Array.isArray(shape.links)) {
      for (const link of shape.links ?? []) {
        const pts = link?.points;
        if (pts && pts.length >= 2) {
          out.push({
            coords: pts.map((p) => [p.lat, p.lng]),
            jamFactor: jam,
            level: levelFor(jam)
          });
        }
      }
      continue;
    }
    if (Array.isArray(shape) && shape.length >= 2) {
      const pts = shape;
      out.push({
        coords: pts.map((p) => [p.lat, p.lng]),
        jamFactor: jam,
        level: levelFor(jam)
      });
    }
  }
  return out;
}
const route25 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
const UA = "BJKLimoRideBook/1.0 (ride-booking; contact@bjklimo.local)";
async function photonLookup(address, signal) {
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1&lang=en`, {
      signal,
      headers: {
        "User-Agent": UA
      }
    });
    if (!res.ok) return null;
    const data2 = await res.json();
    const f = data2.features?.find((feature) => serviceStateAbbr(feature.properties?.state));
    const coords = f?.geometry?.coordinates;
    if (!coords || coords.length < 2) return null;
    const p = f?.properties ?? {};
    const street = [p.housenumber, p.street].filter(Boolean).join(" ") || p.name || "";
    const city = p.city || p.district || p.county || "";
    const secondary = [[p.postcode, city].filter(Boolean).join(" "), p.state, p.country].filter(Boolean).join(", ");
    const formatted = [street, secondary].filter(Boolean).join(", ");
    if (!formatted) return null;
    return {
      formattedAddress: formatted,
      lat: coords[1],
      lng: coords[0]
    };
  } catch {
    return null;
  }
}
const loader$3 = withApi(async ({
  request
}) => {
  const url = new URL(request.url);
  const address = (url.searchParams.get("address") ?? url.searchParams.get("q") ?? "").trim();
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!address) {
    return apiError(422, "address query param is required");
  }
  const intent = parseAddressIntent(address);
  const streetLike = isStreetQuery(intent);
  if (streetLike) {
    const hit2 = await lookupStreetAddress(address, request.signal);
    if (hit2) {
      return json({
        verified: true,
        configured: true,
        source: hit2.source,
        formattedAddress: hit2.formattedAddress,
        lat: hit2.lat,
        lng: hit2.lng,
        locationType: "ROOFTOP"
      });
    }
  }
  const airport = matchAirportByText(address);
  if (airport) {
    return json({
      verified: true,
      configured: true,
      formattedAddress: `${airport.code} — ${airport.name}, ${airport.city}, ${airport.country}`,
      lat: airport.lat,
      lng: airport.lng,
      locationType: "airport"
    });
  }
  if (key) {
    try {
      const upstream = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`, {
        signal: request.signal
      });
      if (!upstream.ok) {
        throw new Error(`geocode failed: ${upstream.status} ${upstream.statusText}`);
      }
      const data2 = await upstream.json();
      const result = data2.results?.[0];
      const state = result?.address_components?.find((c) => c.types?.includes("administrative_area_level_1"))?.short_name;
      if (data2.status === "OK" && result && isServiceState(state) && (!streetLike || houseNumberInText(result.formatted_address ?? "", intent.house))) {
        return json({
          verified: true,
          configured: true,
          formattedAddress: result.formatted_address ?? "",
          lat: result.geometry?.location?.lat,
          lng: result.geometry?.location?.lng,
          locationType: result.geometry?.location_type ?? ""
        });
      }
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("geocode failed:")) throw err;
    }
  }
  const hit = await photonLookup(address, request.signal);
  if (hit && (!streetLike || houseNumberInText(hit.formattedAddress, intent.house))) {
    return json({
      verified: true,
      configured: true,
      source: "photon",
      formattedAddress: hit.formattedAddress,
      lat: hit.lat,
      lng: hit.lng
    });
  }
  return json({
    verified: false,
    configured: true
  });
});
const route26 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const action$5 = withApi(async ({
  request
}) => {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!accessToken || !locationId) {
    return json({
      configured: false
    });
  }
  const body = await readJsonBody(request);
  const reservationId = (body.reservationId ?? "").trim();
  const rawAmount = Number(body.amount);
  const amountCents = Number.isFinite(rawAmount) ? Math.round(rawAmount * 100) : 0;
  if (!reservationId) {
    return apiError(422, "reservationId is required");
  }
  if (amountCents < 100) {
    return json({
      configured: true,
      url: null
    });
  }
  const currency = (body.currency || "USD").toUpperCase();
  const origin = siteOrigin(request);
  const description = body.description || "Reservation";
  const payload = {
    idempotency_key: `${reservationId}-${Date.now()}`,
    description,
    order: {
      location_id: locationId,
      reference_id: reservationId,
      line_items: [{
        name: description,
        quantity: "1",
        base_price_money: {
          amount: amountCents,
          currency
        }
      }]
    },
    checkout_options: {
      redirect_url: `${origin}/payment/success?ref=${reservationId}`,
      ask_for_shipping_address: false,
      enable_coupon: false,
      enable_loyalty: false
    },
    payment_note: `reservation_id:${reservationId}`
  };
  if (body.customerEmail) {
    payload.pre_populated_data = {
      buyer_email: body.customerEmail
    };
  }
  const base = process.env.SQUARE_ENVIRONMENT === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
  const upstream = await fetch(`${base}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": "2024-12-18",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    signal: request.signal
  });
  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    throw new Error(`square checkout failed: ${upstream.status} ${upstream.statusText} ${detail}`);
  }
  const data2 = await upstream.json();
  return json({
    configured: true,
    url: data2.payment_link?.url ?? null
  });
});
const route27 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5
}, Symbol.toStringTag, { value: "Module" }));
const action$4 = withApi(async ({
  request
}) => {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!accessToken || !locationId) {
    return json({
      ok: false,
      needsConfiguration: true
    });
  }
  const body = await readJsonBody(request);
  const reservationId = (body.reservationId ?? "").trim();
  const sourceId = (body.sourceId ?? "").trim();
  const rawAmount = Number(body.amount);
  if (!/^[a-z0-9]{15}$/.test(reservationId)) {
    return apiError(422, "a valid reservation reference is required");
  }
  if (!sourceId) {
    return apiError(422, "a card token (sourceId) is required");
  }
  const amountCents = Number.isFinite(rawAmount) ? Math.round(rawAmount * 100) : 0;
  if (amountCents < 100) {
    return apiError(422, "the fare is below the minimum chargeable amount");
  }
  const currency = (body.currency || "USD").toUpperCase();
  const base = process.env.SQUARE_ENVIRONMENT === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
  const upstream = await fetch(`${base}/v2/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": "2024-12-18",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      source_id: sourceId,
      idempotency_key: `${reservationId}-${Date.now()}`,
      amount_money: {
        amount: amountCents,
        currency
      },
      location_id: locationId,
      reference_id: reservationId,
      // Authorize a hold only — do not capture (charge) immediately. The
      // operator captures the authorized payment after the service is
      // completed via /api/square-capture.
      autocomplete: false,
      note: `reservation_id:${reservationId}`
    }),
    signal: request.signal
  });
  const data2 = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const first = data2.errors?.[0];
    const code = first?.code ?? "CARD_DECLINED";
    const detail = friendlyCardError(code, first?.detail);
    logger.error("square-pay: payment rejected", `${upstream.status} ${code}`);
    return json({
      ok: false,
      declined: true,
      code,
      message: detail
    });
  }
  const status = data2.payment?.status;
  const paymentId = data2.payment?.id;
  const authorized = status === "AUTHORIZED" || status === "APPROVED";
  if (!authorized) {
    logger.error("square-pay: payment not authorized", `status=${status ?? "unknown"}`);
    return json({
      ok: false,
      declined: true,
      code: "NOT_AUTHORIZED",
      message: "Your card could not be authorized. Please check your details or try a different card."
    });
  }
  try {
    await pocketbaseAdmin.updateRecord("reservations", reservationId, {
      paid: true,
      captured: false,
      status: "confirmed",
      ...paymentId ? {
        squareOrderId: paymentId
      } : {}
    });
  } catch (err) {
    const status2 = err?.status;
    if (status2 === 404) {
      return apiError(404, "reservation not found");
    }
    logger.error("square-pay: failed to mark reservation paid", String(err));
    throw err;
  }
  logger.info("square-pay: reservation authorized (hold placed)", reservationId);
  return json({
    ok: true,
    authorized: true
  });
});
function friendlyCardError(code, detail) {
  switch (code) {
    case "CARD_DECLINED":
    case "CARD_DECLINED_CALL_ISSUER":
    case "CARD_DECLINED_INSUFFICIENT_FUNDS":
    case "CARD_DECLINED_INCORRECT_CVV":
    case "CARD_DECLINED_EXPIRED":
    case "CARD_DECLINED_INVALID_PIN":
      return "Your card was declined. Please check your details or try a different card.";
    case "INVALID_PIN":
    case "INSUFFICIENT_FUNDS":
      return "Your card was declined. Please try a different card.";
    case "EXPIRED_CARD":
      return "Your card has expired. Please try a different card.";
    case "INVALID_POSTAL_CODE":
      return "The postal code doesn't match. Please check your details and try again.";
    case "CARD_TOKEN_ALREADY_USED":
    case "IDEMPOTENCY_KEY_REUSED":
      return "This payment was already processed. Please start a new booking.";
    case "INVALID_CARD_DATA":
      return "The card details couldn't be read. Please re-enter your card information.";
    default:
      return detail ? "We couldn't process your payment. Please try a different card." : "We couldn't process your payment. Please try again or use a different card.";
  }
}
const route28 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4
}, Symbol.toStringTag, { value: "Module" }));
const PB_URL$1 = () => process.env.POCKETBASE_URL || "http://localhost:8090";
function decodeCallerId$1(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return "";
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload.id === "string" ? payload.id : "";
  } catch {
    return "";
  }
}
async function verifyOperator$1(authHeader) {
  if (!authHeader) throw apiError(401, "Sign in required.");
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw apiError(401, "Sign in required.");
  const callerId = decodeCallerId$1(token);
  if (!callerId) throw apiError(401, "Your session has expired. Please sign in again.");
  const client = new PocketBase(PB_URL$1());
  client.autoCancellation(false);
  client.authStore.save(token, null);
  try {
    const rec = await client.collection("users").getOne(callerId);
    if (rec.collectionName !== "users") {
      throw apiError(403, "Only operators may capture payments.");
    }
    return callerId;
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) throw err;
    throw apiError(401, "Your session has expired. Please sign in again.");
  }
}
const action$3 = withApi(async ({
  request
}) => {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) {
    return json({
      ok: false,
      needsConfiguration: true
    });
  }
  const callerId = await verifyOperator$1(request.headers.get("authorization"));
  const {
    ref
  } = await readJsonBody(request);
  const id = (ref ?? "").trim();
  if (!/^[a-z0-9]{15}$/.test(id)) {
    return apiError(422, "a valid reservation reference is required");
  }
  let reservation;
  try {
    reservation = await pocketbaseAdmin.getRecord("reservations", id);
  } catch {
    return apiError(404, "reservation not found");
  }
  const ownerRaw = reservation.owner;
  const ownerId = Array.isArray(ownerRaw) ? ownerRaw[0] || "" : ownerRaw ? String(ownerRaw) : "";
  const centralRaw = reservation.centralOperator;
  const centralId = Array.isArray(centralRaw) ? centralRaw[0] || "" : centralRaw ? String(centralRaw) : "";
  let authorized = ownerId === callerId || centralId === callerId;
  if (!authorized && ownerId) {
    try {
      const ownerRec = await pocketbaseAdmin.getRecord("users", ownerId);
      const mb = ownerRec.managedBy;
      const mbId = Array.isArray(mb) ? mb[0] || "" : mb ? String(mb) : "";
      if (mbId === callerId) authorized = true;
    } catch {
    }
  }
  if (!authorized) {
    return apiError(403, "You can only capture payments for reservations you own or manage.");
  }
  const paymentId = (reservation.squareOrderId ?? "").trim();
  if (!paymentId) {
    return apiError(422, "This reservation has no authorized payment to capture.");
  }
  if (!reservation.paid) {
    return apiError(422, "This reservation has not been authorized for payment.");
  }
  if (reservation.captured) {
    return json({
      ok: true,
      alreadyCaptured: true
    });
  }
  const base = process.env.SQUARE_ENVIRONMENT === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
  const upstream = await fetch(`${base}/v2/payments/${paymentId}/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": "2024-12-18",
      "Content-Type": "application/json"
    },
    signal: request.signal
  });
  const data2 = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const first = data2.errors?.[0];
    const code = first?.code ?? "CAPTURE_FAILED";
    logger.error("square-capture: capture rejected", `${upstream.status} ${code}`);
    return json({
      ok: false,
      declined: true,
      code,
      message: captureErrorMessage(code, first?.detail)
    });
  }
  const status = data2.payment?.status;
  if (status !== "COMPLETED") {
    logger.error("square-capture: payment not completed after capture", `status=${status ?? "unknown"}`);
    return json({
      ok: false,
      declined: true,
      code: "NOT_COMPLETED",
      message: "The payment could not be captured yet. Please try again shortly."
    });
  }
  try {
    await pocketbaseAdmin.updateRecord("reservations", id, {
      captured: true,
      paid: true
    });
  } catch (err) {
    logger.error("square-capture: failed to mark reservation captured", String(err));
    throw err;
  }
  logger.info("square-capture: reservation payment captured", id);
  return json({
    ok: true,
    captured: true
  });
});
function captureErrorMessage(code, detail) {
  switch (code) {
    case "PAYMENT_NOT_AUTHORIZED":
      return "The payment authorization has expired or was voided. The customer must rebook.";
    case "REQUEST_TIMEOUT":
    case "INTERNAL_SERVER_ERROR":
      return "Square could not complete the capture right now. Please try again.";
    case "NOT_FOUND":
      return "The authorized payment could not be found in Square. It may have been voided.";
    default:
      return detail ? "The payment could not be captured. Please try again or contact Square support." : "The payment could not be captured. Please try again.";
  }
}
const route29 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3
}, Symbol.toStringTag, { value: "Module" }));
const PB_URL = () => process.env.POCKETBASE_URL || "http://localhost:8090";
function decodeCallerId(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return "";
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload.id === "string" ? payload.id : "";
  } catch {
    return "";
  }
}
async function verifyOperator(authHeader) {
  if (!authHeader) throw apiError(401, "Sign in required.");
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw apiError(401, "Sign in required.");
  const callerId = decodeCallerId(token);
  if (!callerId) throw apiError(401, "Your session has expired. Please sign in again.");
  const client = new PocketBase(PB_URL());
  client.autoCancellation(false);
  client.authStore.save(token, null);
  try {
    const rec = await client.collection("users").getOne(callerId);
    if (rec.collectionName !== "users") {
      throw apiError(403, "Only operators may view payment details.");
    }
    return callerId;
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) throw err;
    throw apiError(401, "Your session has expired. Please sign in again.");
  }
}
const action$2 = withApi(async ({
  request
}) => {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) {
    return json({
      ok: false,
      needsConfiguration: true
    });
  }
  const callerId = await verifyOperator(request.headers.get("authorization"));
  const {
    ref
  } = await readJsonBody(request);
  const id = (ref ?? "").trim();
  if (!/^[a-z0-9]{15}$/.test(id)) {
    return apiError(422, "a valid reservation reference is required");
  }
  let reservation;
  try {
    reservation = await pocketbaseAdmin.getRecord("reservations", id);
  } catch {
    return apiError(404, "reservation not found");
  }
  const ownerRaw = reservation.owner;
  const ownerId = Array.isArray(ownerRaw) ? ownerRaw[0] || "" : ownerRaw ? String(ownerRaw) : "";
  const centralRaw = reservation.centralOperator;
  const centralId = Array.isArray(centralRaw) ? centralRaw[0] || "" : centralRaw ? String(centralRaw) : "";
  let authorized = ownerId === callerId || centralId === callerId;
  if (!authorized && ownerId) {
    try {
      const ownerRec = await pocketbaseAdmin.getRecord("users", ownerId);
      const mb = ownerRec.managedBy;
      const mbId = Array.isArray(mb) ? mb[0] || "" : mb ? String(mb) : "";
      if (mbId === callerId) authorized = true;
    } catch {
    }
  }
  if (!authorized) {
    return apiError(403, "You can only view payments for reservations you own or manage.");
  }
  const paymentId = (reservation.squareOrderId ?? "").trim();
  if (!paymentId) {
    return json({
      ok: true,
      paid: !!reservation.paid,
      captured: !!reservation.captured,
      paymentId: "",
      status: reservation.paid ? reservation.captured ? "COMPLETED" : "AUTHORIZED" : "NONE",
      amount: null,
      currency: null,
      cardBrand: null,
      last4: null
    });
  }
  const base = process.env.SQUARE_ENVIRONMENT === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
  const upstream = await fetch(`${base}/v2/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": "2024-12-18"
    },
    signal: request.signal
  });
  const data2 = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const first = data2.errors?.[0];
    logger.error("square-payment-details: lookup failed", `${upstream.status} ${first?.code ?? "unknown"}`);
    return json({
      ok: false,
      lookupFailed: true,
      paid: !!reservation.paid,
      captured: !!reservation.captured,
      paymentId,
      status: reservation.paid ? reservation.captured ? "COMPLETED" : "AUTHORIZED" : "NONE",
      amount: null,
      currency: null,
      cardBrand: null,
      last4: null,
      message: "Square could not return payment details right now. The local payment status is shown instead."
    });
  }
  const payment = data2.payment;
  const amount = payment?.amount_money?.amount ?? null;
  const currency = payment?.amount_money?.currency ?? null;
  const card = payment?.card_details?.card;
  const status = payment?.status ?? "";
  if (status === "COMPLETED" && !reservation.captured) {
    try {
      await pocketbaseAdmin.updateRecord("reservations", id, {
        captured: true,
        paid: true
      });
    } catch (err) {
      logger.error("square-payment-details: failed to sync captured flag", String(err));
    }
  }
  return json({
    ok: true,
    paid: !!reservation.paid || status === "AUTHORIZED" || status === "APPROVED" || status === "COMPLETED",
    captured: !!reservation.captured || status === "COMPLETED",
    paymentId: payment?.id ?? paymentId,
    status,
    amount,
    currency,
    // Only the brand and last four — never the full PAN or CVV.
    cardBrand: card?.card_brand ?? null,
    last4: card?.last_4 ?? null
  });
});
const route30 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2
}, Symbol.toStringTag, { value: "Module" }));
const action$1 = withApi(async ({
  request
}) => {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signatureKey) {
    return json({
      received: false,
      message: "Square webhook not configured"
    });
  }
  const signature = request.headers.get("x-square-h1sha256-signature") ?? "";
  const rawBody = await request.text();
  const notificationUrl = `${siteOrigin(request)}/api/square-webhook`;
  const expected = crypto.createHmac("sha256", signatureKey).update(notificationUrl + rawBody).digest("base64");
  if (expected !== signature) {
    return json({
      error: "signature mismatch"
    }, {
      status: 400
    });
  }
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({
      error: "invalid payload"
    }, {
      status: 400
    });
  }
  const obj = event.data?.object;
  const reservationId = obj?.reference_id || obj?.metadata?.reservation_id;
  const paymentStatus = obj?.status || obj?.state;
  if (reservationId && /^[a-z0-9]{15}$/.test(reservationId)) {
    try {
      const isCompleted = paymentStatus === "COMPLETED" || event.type === "order.paid" || event.type === "order.fulfilled";
      const isAuthorized = paymentStatus === "AUTHORIZED" || paymentStatus === "APPROVED";
      if (isCompleted) {
        await pocketbaseAdmin.updateRecord("reservations", reservationId, {
          paid: true,
          captured: true,
          status: "confirmed",
          ...obj?.id ? {
            squareOrderId: obj.id
          } : {}
        });
      } else if (isAuthorized) {
        await pocketbaseAdmin.updateRecord("reservations", reservationId, {
          paid: true,
          captured: false,
          status: "confirmed",
          ...obj?.id ? {
            squareOrderId: obj.id
          } : {}
        });
      }
    } catch (err) {
      logger.error("square webhook: failed to sync reservation payment state", String(err));
    }
  }
  return json({
    received: true
  });
});
const route31 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1
}, Symbol.toStringTag, { value: "Module" }));
const DEFAULT_BUSINESS_NAME$1 = "ELITELIMOLINK";
async function loader$2({
  url
}) {
  const ref = url.searchParams.get("ref") ?? "";
  let businessName = DEFAULT_BUSINESS_NAME$1;
  try {
    const name = await loadBusinessNameByReservation(ref);
    if (name) businessName = name;
  } catch {
  }
  return {
    ref,
    businessName
  };
}
function meta$1({
  matches,
  location,
  loaderData
}) {
  const businessName = loaderData?.businessName || DEFAULT_BUSINESS_NAME$1;
  return seo({
    matches,
    location
  }, {
    title: `Payment Received | ${businessName}`,
    description: `Your ${businessName} reservation payment was processed successfully.`,
    noindex: true
  });
}
const payment_success = UNSAFE_withComponentProps(function PaymentSuccess({
  loaderData
}) {
  const {
    ref,
    businessName
  } = loaderData;
  const [status, setStatus] = useState("verifying");
  useEffect(() => {
    if (!ref) return;
    let active = true;
    let timer;
    let attempt = 0;
    const verify = () => {
      attempt += 1;
      fetch("/api/payment-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ref
        })
      }).then((res) => res.ok ? res.json() : Promise.reject(new Error(`payment-complete ${res.status}`))).then((data2) => {
        if (!active) return;
        if (data2?.ok) {
          setStatus("confirmed");
          return;
        }
        if (data2?.needsConfiguration) {
          setStatus("unavailable");
          return;
        }
        if (attempt < 5) {
          timer = window.setTimeout(verify, 2e3);
        } else {
          setStatus("pending");
        }
      }).catch(() => {
        if (!active) return;
        if (attempt < 5) {
          timer = window.setTimeout(verify, 2e3);
        } else {
          setStatus("error");
        }
      });
    };
    verify();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [ref]);
  const lineText = status === "confirmed" ? "Paid — reservation confirmed" : status === "unavailable" ? "Payment verification unavailable — please contact us with your reference" : status === "pending" ? "Payment is still being confirmed — we will reach out shortly" : status === "error" ? "We could not confirm your payment — please contact us with your reference" : "Confirming your payment…";
  return /* @__PURE__ */ jsxs("main", {
    className: "booking-page payment-status",
    children: [/* @__PURE__ */ jsx("div", {
      className: "ambient ambient-one"
    }), /* @__PURE__ */ jsx("div", {
      className: "ambient ambient-two"
    }), /* @__PURE__ */ jsxs("div", {
      className: "page-brand",
      children: [/* @__PURE__ */ jsxs("span", {
        className: "brand-mark",
        children: ["B", /* @__PURE__ */ jsx("span", {
          children: "L"
        })]
      }), /* @__PURE__ */ jsxs("span", {
        className: "brand-word",
        children: [businessName, /* @__PURE__ */ jsx("span", {
          className: "brand-sub",
          children: " / RESERVATIONS"
        })]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "payment-card",
      children: [/* @__PURE__ */ jsx(ThemeToggle, {
        className: "theme-toggle card-theme"
      }), /* @__PURE__ */ jsx("div", {
        className: "done-check",
        children: /* @__PURE__ */ jsx(Check, {
          size: 29,
          strokeWidth: 2.5
        })
      }), /* @__PURE__ */ jsx("span", {
        className: "eyebrow",
        children: status === "confirmed" ? "PAYMENT RECEIVED" : "PROCESSING"
      }), /* @__PURE__ */ jsx("h2", {
        children: status === "confirmed" ? "Your ride is booked." : "Confirming your booking."
      }), /* @__PURE__ */ jsx("p", {
        className: "done-lead",
        children: status === "confirmed" ? "Thanks for your payment. Your reservation is complete and a receipt is on its way to your email. We’ll reach out with any pickup details." : "We’re verifying your payment with Square before confirming your reservation. You won’t be charged twice."
      }), ref && /* @__PURE__ */ jsxs("div", {
        className: "done-card",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "done-card-top",
          children: [/* @__PURE__ */ jsx("span", {
            children: "RESERVATION REFERENCE"
          }), /* @__PURE__ */ jsxs("strong", {
            children: ["RB-", ref.slice(-8).toUpperCase()]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "done-card-line",
          children: [/* @__PURE__ */ jsx(CreditCard, {
            size: 17
          }), /* @__PURE__ */ jsx("span", {
            children: lineText
          })]
        })]
      }), /* @__PURE__ */ jsx("p", {
        className: "done-footnote",
        children: "Save your reference for your records."
      }), /* @__PURE__ */ jsxs("a", {
        href: "/",
        className: "primary-button",
        children: ["Back to booking ", /* @__PURE__ */ jsx(ArrowRight, {
          size: 17
        })]
      })]
    })]
  });
});
const route32 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: payment_success,
  loader: loader$2,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
const DEFAULT_BUSINESS_NAME = "ELITELIMOLINK";
async function loader$1({
  url
}) {
  const ref = url.searchParams.get("ref") ?? "";
  let businessName = DEFAULT_BUSINESS_NAME;
  try {
    const name = await loadBusinessNameByReservation(ref);
    if (name) businessName = name;
  } catch {
  }
  return {
    ref,
    businessName
  };
}
function meta({
  matches,
  location,
  loaderData
}) {
  const businessName = loaderData?.businessName || DEFAULT_BUSINESS_NAME;
  return seo({
    matches,
    location
  }, {
    title: `Payment Cancelled | ${businessName}`,
    description: "No charge was made — the booking was not completed.",
    noindex: true
  });
}
const payment_cancel = UNSAFE_withComponentProps(function PaymentCancel({
  loaderData
}) {
  const {
    ref,
    businessName
  } = loaderData;
  const [cleared, setCleared] = useState(false);
  useEffect(() => {
    if (!ref) return;
    let active = true;
    fetch("/api/payment-abandon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ref
      })
    }).then((res) => res.ok ? res.json() : Promise.reject(new Error(`payment-abandon ${res.status}`))).then(() => {
      if (active) setCleared(true);
    }).catch(() => {
    });
    return () => {
      active = false;
    };
  }, [ref]);
  return /* @__PURE__ */ jsxs("main", {
    className: "booking-page payment-status payment-cancel",
    children: [/* @__PURE__ */ jsx("div", {
      className: "ambient ambient-one"
    }), /* @__PURE__ */ jsx("div", {
      className: "ambient ambient-two"
    }), /* @__PURE__ */ jsxs("div", {
      className: "page-brand",
      children: [/* @__PURE__ */ jsxs("span", {
        className: "brand-mark",
        children: ["B", /* @__PURE__ */ jsx("span", {
          children: "L"
        })]
      }), /* @__PURE__ */ jsxs("span", {
        className: "brand-word",
        children: [businessName, /* @__PURE__ */ jsx("span", {
          className: "brand-sub",
          children: " / RESERVATIONS"
        })]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "payment-card",
      children: [/* @__PURE__ */ jsx(ThemeToggle, {
        className: "theme-toggle card-theme"
      }), /* @__PURE__ */ jsx("div", {
        className: "done-check",
        children: /* @__PURE__ */ jsx(XCircle, {
          size: 29,
          strokeWidth: 2.5
        })
      }), /* @__PURE__ */ jsx("span", {
        className: "eyebrow",
        children: "PAYMENT NOT COMPLETED"
      }), /* @__PURE__ */ jsx("h2", {
        children: "No charge — no problem."
      }), /* @__PURE__ */ jsxs("p", {
        className: "done-lead",
        children: ["Your card was not charged and your ride is not booked. ", cleared ? "Your pending request was cleared so you can start fresh." : "Your trip details are being cleared.", " Return to the booking page to try again — the fare is recalculated from the exact mileage before you pay."]
      }), ref && /* @__PURE__ */ jsx("div", {
        className: "done-card",
        children: /* @__PURE__ */ jsxs("div", {
          className: "done-card-top",
          children: [/* @__PURE__ */ jsx("span", {
            children: "REFERENCE"
          }), /* @__PURE__ */ jsxs("strong", {
            children: ["RB-", ref.slice(-8).toUpperCase()]
          })]
        })
      }), /* @__PURE__ */ jsx("p", {
        className: "done-footnote",
        children: "No reservation is kept when payment is not completed."
      }), /* @__PURE__ */ jsxs("a", {
        href: "/",
        className: "primary-button",
        children: ["Back to booking ", /* @__PURE__ */ jsx(ArrowRight, {
          size: 17
        })]
      })]
    })]
  });
});
const route33 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: payment_cancel,
  loader: loader$1,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const notFound = withApi(async () => apiError(404, "Route not found"));
const loader = notFound;
const action = notFound;
const route34 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-Cl7sjbsF.js", "imports": ["/assets/jsx-runtime-u17CrQMm.js", "/assets/utils-CRKigPxt.js", "/assets/errorBoundaries-D6nKvvZW.js", "/assets/components-BXvrpWac.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": true, "module": "/assets/root-C6NmkkiE.js", "imports": ["/assets/jsx-runtime-u17CrQMm.js", "/assets/utils-CRKigPxt.js", "/assets/errorBoundaries-D6nKvvZW.js", "/assets/components-BXvrpWac.js", "/assets/preload-helper-BW8JXsGI.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": true, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/home-main-DLStgZYD.js", "imports": ["/assets/components-BXvrpWac.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/utils-CRKigPxt.js", "/assets/theme-toggle-Bt9wJrY5.js", "/assets/preload-helper-BW8JXsGI.js", "/assets/pocketbase-client-CicLDX7G.js", "/assets/reservation-CeBh4OF0.js", "/assets/pricing-CCVhZN-4.js", "/assets/x-DcWXzC59.js", "/assets/check-CFZYt0iU.js", "/assets/plane-C2Pgt6Oa.js", "/assets/triangle-alert-bS-_CIb3.js", "/assets/calendar-days-CgPjU-1N.js", "/assets/arrow-left-B2bIMvqb.js", "/assets/arrow-right-CFfnj4mG.js", "/assets/lock-keyhole-CR8TeY6n.js", "/assets/credit-card-h0sqP67j.js", "/assets/home-client-loader-BDn4X6xx.js", "/assets/errorBoundaries-D6nKvvZW.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": "/assets/home-client-loader-BDn4X6xx.js", "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "login", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/login-SW4VUZQg.js", "imports": ["/assets/components-BXvrpWac.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/utils-CRKigPxt.js", "/assets/theme-toggle-Bt9wJrY5.js", "/assets/pocketbase-client-CicLDX7G.js", "/assets/forgot-password-DFTZCI4r.js", "/assets/user-plus-BtrWawAD.js", "/assets/lock-keyhole-CR8TeY6n.js", "/assets/arrow-right-CFfnj4mG.js", "/assets/arrow-left-B2bIMvqb.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/driver": { "id": "routes/driver", "parentId": "root", "path": "driver", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": true, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/driver-main-D7mEemht.js", "imports": ["/assets/components-BXvrpWac.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/theme-toggle-Bt9wJrY5.js", "/assets/utils-CRKigPxt.js", "/assets/pocketbase-client-CicLDX7G.js", "/assets/use-driver-auth-PLr7WakE.js", "/assets/reservation-CeBh4OF0.js", "/assets/status-badge-_9VTtZQq.js", "/assets/navigation-DHLYx4Q5.js", "/assets/x-DcWXzC59.js", "/assets/plane-C2Pgt6Oa.js", "/assets/lock-keyhole-CR8TeY6n.js", "/assets/check-CFZYt0iU.js", "/assets/driver-client-loader-CvyP2q_8.js", "/assets/require-auth-Bpn5-rCs.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": "/assets/driver-client-loader-CvyP2q_8.js", "clientMiddlewareModule": void 0, "hydrateFallbackModule": "/assets/driver-hydrate-fallback-BDdNZsnd.js" }, "routes/driver.login": { "id": "routes/driver.login", "parentId": "root", "path": "driver/login", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": true, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/driver.login-main-CnBpXaHz.js", "imports": ["/assets/components-BXvrpWac.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/theme-toggle-Bt9wJrY5.js", "/assets/utils-CRKigPxt.js", "/assets/use-driver-auth-PLr7WakE.js", "/assets/forgot-password-DFTZCI4r.js", "/assets/lock-keyhole-CR8TeY6n.js", "/assets/arrow-right-CFfnj4mG.js", "/assets/driver.login-client-loader-DlpcTBxJ.js", "/assets/pocketbase-client-CicLDX7G.js", "/assets/arrow-left-B2bIMvqb.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": "/assets/driver.login-client-loader-DlpcTBxJ.js", "clientMiddlewareModule": void 0, "hydrateFallbackModule": "/assets/driver.login-hydrate-fallback-DC-LMCAO.js" }, "routes/driver.register": { "id": "routes/driver.register", "parentId": "root", "path": "driver/register", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": true, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/driver.register-main-BR7Mlmp3.js", "imports": ["/assets/components-BXvrpWac.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/theme-toggle-Bt9wJrY5.js", "/assets/utils-CRKigPxt.js", "/assets/use-driver-auth-PLr7WakE.js", "/assets/reservation-CeBh4OF0.js", "/assets/user-plus-BtrWawAD.js", "/assets/arrow-right-CFfnj4mG.js", "/assets/driver.register-client-loader-DlpcTBxJ.js", "/assets/pocketbase-client-CicLDX7G.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": "/assets/driver.register-client-loader-DlpcTBxJ.js", "clientMiddlewareModule": void 0, "hydrateFallbackModule": "/assets/driver.register-hydrate-fallback-DC-LMCAO.js" }, "routes/dashboard": { "id": "routes/dashboard", "parentId": "root", "path": "dashboard", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": true, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/dashboard-main-D0Uz0g1x.js", "imports": ["/assets/components-BXvrpWac.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/theme-toggle-Bt9wJrY5.js", "/assets/utils-CRKigPxt.js", "/assets/preload-helper-BW8JXsGI.js", "/assets/pocketbase-client-CicLDX7G.js", "/assets/reservation-editor-CmijxpY7.js", "/assets/reservation-CeBh4OF0.js", "/assets/status-badge-_9VTtZQq.js", "/assets/pricing-CCVhZN-4.js", "/assets/x-DcWXzC59.js", "/assets/triangle-alert-bS-_CIb3.js", "/assets/check-CFZYt0iU.js", "/assets/navigation-DHLYx4Q5.js", "/assets/plane-C2Pgt6Oa.js", "/assets/credit-card-h0sqP67j.js", "/assets/arrow-right-CFfnj4mG.js", "/assets/dashboard-client-loader-D_ZhjfxZ.js", "/assets/errorBoundaries-D6nKvvZW.js", "/assets/require-auth-Bpn5-rCs.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": "/assets/dashboard-client-loader-D_ZhjfxZ.js", "clientMiddlewareModule": void 0, "hydrateFallbackModule": "/assets/dashboard-hydrate-fallback-BDdNZsnd.js" }, "routes/dispatch": { "id": "routes/dispatch", "parentId": "root", "path": "dispatch", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": true, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/dispatch-main-DO_lPf7a.js", "imports": ["/assets/components-BXvrpWac.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/theme-toggle-Bt9wJrY5.js", "/assets/utils-CRKigPxt.js", "/assets/pocketbase-client-CicLDX7G.js", "/assets/reservation-editor-CmijxpY7.js", "/assets/reservation-CeBh4OF0.js", "/assets/status-badge-_9VTtZQq.js", "/assets/x-DcWXzC59.js", "/assets/calendar-days-CgPjU-1N.js", "/assets/dispatch-client-loader-D_ZhjfxZ.js", "/assets/pricing-CCVhZN-4.js", "/assets/credit-card-h0sqP67j.js", "/assets/check-CFZYt0iU.js", "/assets/require-auth-Bpn5-rCs.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": "/assets/dispatch-client-loader-D_ZhjfxZ.js", "clientMiddlewareModule": void 0, "hydrateFallbackModule": "/assets/dispatch-hydrate-fallback-BDdNZsnd.js" }, "routes/sitemap.xml": { "id": "routes/sitemap.xml", "parentId": "root", "path": "sitemap.xml", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/sitemap.xml-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/robots.txt": { "id": "routes/robots.txt", "parentId": "root", "path": "robots.txt", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/robots.txt-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.health": { "id": "routes/api.health", "parentId": "root", "path": "api/health", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.health-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.places-autocomplete": { "id": "routes/api.places-autocomplete", "parentId": "root", "path": "api/places-autocomplete", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.places-autocomplete-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.pricing": { "id": "routes/api.pricing", "parentId": "root", "path": "api/pricing", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.pricing-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.businesses": { "id": "routes/api.businesses", "parentId": "root", "path": "api/businesses", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.businesses-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.business-settings": { "id": "routes/api.business-settings", "parentId": "root", "path": "api/business-settings", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.business-settings-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.business-tiers": { "id": "routes/api.business-tiers", "parentId": "root", "path": "api/business-tiers", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.business-tiers-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.payment-status": { "id": "routes/api.payment-status", "parentId": "root", "path": "api/payment-status", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.payment-status-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.activity": { "id": "routes/api.activity", "parentId": "root", "path": "api/activity", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.activity-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.fare-quote": { "id": "routes/api.fare-quote", "parentId": "root", "path": "api/fare-quote", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.fare-quote-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.driver-trip": { "id": "routes/api.driver-trip", "parentId": "root", "path": "api/driver-trip", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.driver-trip-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.driver-location": { "id": "routes/api.driver-location", "parentId": "root", "path": "api/driver-location", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.driver-location-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.payment-complete": { "id": "routes/api.payment-complete", "parentId": "root", "path": "api/payment-complete", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.payment-complete-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.payment-abandon": { "id": "routes/api.payment-abandon", "parentId": "root", "path": "api/payment-abandon", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.payment-abandon-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.route-map": { "id": "routes/api.route-map", "parentId": "root", "path": "api/route-map", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.route-map-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.route-data": { "id": "routes/api.route-data", "parentId": "root", "path": "api/route-data", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.route-data-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.traffic": { "id": "routes/api.traffic", "parentId": "root", "path": "api/traffic", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.traffic-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.geocode": { "id": "routes/api.geocode", "parentId": "root", "path": "api/geocode", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.geocode-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.square-checkout": { "id": "routes/api.square-checkout", "parentId": "root", "path": "api/square-checkout", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.square-checkout-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.square-pay": { "id": "routes/api.square-pay", "parentId": "root", "path": "api/square-pay", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.square-pay-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.square-capture": { "id": "routes/api.square-capture", "parentId": "root", "path": "api/square-capture", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.square-capture-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.square-payment-details": { "id": "routes/api.square-payment-details", "parentId": "root", "path": "api/square-payment-details", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.square-payment-details-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.square-webhook": { "id": "routes/api.square-webhook", "parentId": "root", "path": "api/square-webhook", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.square-webhook-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/payment.success": { "id": "routes/payment.success", "parentId": "root", "path": "payment/success", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/payment.success-BN339KZQ.js", "imports": ["/assets/components-BXvrpWac.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/utils-CRKigPxt.js", "/assets/theme-toggle-Bt9wJrY5.js", "/assets/check-CFZYt0iU.js", "/assets/credit-card-h0sqP67j.js", "/assets/arrow-right-CFfnj4mG.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/payment.cancel": { "id": "routes/payment.cancel", "parentId": "root", "path": "payment/cancel", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/payment.cancel-By_qGH_P.js", "imports": ["/assets/components-BXvrpWac.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/utils-CRKigPxt.js", "/assets/theme-toggle-Bt9wJrY5.js", "/assets/arrow-right-CFfnj4mG.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.$": { "id": "routes/api.$", "parentId": "root", "path": "api/*", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api._-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home-biz-slug": { "id": "routes/home-biz-slug", "parentId": "root", "path": "biz/:bizSlug", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": true, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/home-main-DLStgZYD.js", "imports": ["/assets/components-BXvrpWac.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/utils-CRKigPxt.js", "/assets/theme-toggle-Bt9wJrY5.js", "/assets/preload-helper-BW8JXsGI.js", "/assets/pocketbase-client-CicLDX7G.js", "/assets/reservation-CeBh4OF0.js", "/assets/pricing-CCVhZN-4.js", "/assets/x-DcWXzC59.js", "/assets/check-CFZYt0iU.js", "/assets/plane-C2Pgt6Oa.js", "/assets/triangle-alert-bS-_CIb3.js", "/assets/calendar-days-CgPjU-1N.js", "/assets/arrow-left-B2bIMvqb.js", "/assets/arrow-right-CFfnj4mG.js", "/assets/lock-keyhole-CR8TeY6n.js", "/assets/credit-card-h0sqP67j.js", "/assets/home-client-loader-BDn4X6xx.js", "/assets/errorBoundaries-D6nKvvZW.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": "/assets/home-client-loader-BDn4X6xx.js", "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home-slug": { "id": "routes/home-slug", "parentId": "root", "path": ":bizSlug", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": true, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/home-main-DLStgZYD.js", "imports": ["/assets/components-BXvrpWac.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/utils-CRKigPxt.js", "/assets/theme-toggle-Bt9wJrY5.js", "/assets/preload-helper-BW8JXsGI.js", "/assets/pocketbase-client-CicLDX7G.js", "/assets/reservation-CeBh4OF0.js", "/assets/pricing-CCVhZN-4.js", "/assets/x-DcWXzC59.js", "/assets/check-CFZYt0iU.js", "/assets/plane-C2Pgt6Oa.js", "/assets/triangle-alert-bS-_CIb3.js", "/assets/calendar-days-CgPjU-1N.js", "/assets/arrow-left-B2bIMvqb.js", "/assets/arrow-right-CFfnj4mG.js", "/assets/lock-keyhole-CR8TeY6n.js", "/assets/credit-card-h0sqP67j.js", "/assets/home-client-loader-BDn4X6xx.js", "/assets/errorBoundaries-D6nKvvZW.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": "/assets/home-client-loader-BDn4X6xx.js", "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-4938eba4.js", "version": "4938eba4", "sri": void 0 };
const assetsBuildDirectory = "..\\..\\dist\\apps\\web\\client";
const basename = "/";
const future = { "unstable_enableNodeReadableStream": false, "unstable_optimizeDeps": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route36
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: "login",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/driver": {
    id: "routes/driver",
    parentId: "root",
    path: "driver",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/driver.login": {
    id: "routes/driver.login",
    parentId: "root",
    path: "driver/login",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/driver.register": {
    id: "routes/driver.register",
    parentId: "root",
    path: "driver/register",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/dashboard": {
    id: "routes/dashboard",
    parentId: "root",
    path: "dashboard",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/dispatch": {
    id: "routes/dispatch",
    parentId: "root",
    path: "dispatch",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/sitemap.xml": {
    id: "routes/sitemap.xml",
    parentId: "root",
    path: "sitemap.xml",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/robots.txt": {
    id: "routes/robots.txt",
    parentId: "root",
    path: "robots.txt",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/api.health": {
    id: "routes/api.health",
    parentId: "root",
    path: "api/health",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/api.places-autocomplete": {
    id: "routes/api.places-autocomplete",
    parentId: "root",
    path: "api/places-autocomplete",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/api.pricing": {
    id: "routes/api.pricing",
    parentId: "root",
    path: "api/pricing",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  },
  "routes/api.businesses": {
    id: "routes/api.businesses",
    parentId: "root",
    path: "api/businesses",
    index: void 0,
    caseSensitive: void 0,
    module: route13
  },
  "routes/api.business-settings": {
    id: "routes/api.business-settings",
    parentId: "root",
    path: "api/business-settings",
    index: void 0,
    caseSensitive: void 0,
    module: route14
  },
  "routes/api.business-tiers": {
    id: "routes/api.business-tiers",
    parentId: "root",
    path: "api/business-tiers",
    index: void 0,
    caseSensitive: void 0,
    module: route15
  },
  "routes/api.payment-status": {
    id: "routes/api.payment-status",
    parentId: "root",
    path: "api/payment-status",
    index: void 0,
    caseSensitive: void 0,
    module: route16
  },
  "routes/api.activity": {
    id: "routes/api.activity",
    parentId: "root",
    path: "api/activity",
    index: void 0,
    caseSensitive: void 0,
    module: route17
  },
  "routes/api.fare-quote": {
    id: "routes/api.fare-quote",
    parentId: "root",
    path: "api/fare-quote",
    index: void 0,
    caseSensitive: void 0,
    module: route18
  },
  "routes/api.driver-trip": {
    id: "routes/api.driver-trip",
    parentId: "root",
    path: "api/driver-trip",
    index: void 0,
    caseSensitive: void 0,
    module: route19
  },
  "routes/api.driver-location": {
    id: "routes/api.driver-location",
    parentId: "root",
    path: "api/driver-location",
    index: void 0,
    caseSensitive: void 0,
    module: route20
  },
  "routes/api.payment-complete": {
    id: "routes/api.payment-complete",
    parentId: "root",
    path: "api/payment-complete",
    index: void 0,
    caseSensitive: void 0,
    module: route21
  },
  "routes/api.payment-abandon": {
    id: "routes/api.payment-abandon",
    parentId: "root",
    path: "api/payment-abandon",
    index: void 0,
    caseSensitive: void 0,
    module: route22
  },
  "routes/api.route-map": {
    id: "routes/api.route-map",
    parentId: "root",
    path: "api/route-map",
    index: void 0,
    caseSensitive: void 0,
    module: route23
  },
  "routes/api.route-data": {
    id: "routes/api.route-data",
    parentId: "root",
    path: "api/route-data",
    index: void 0,
    caseSensitive: void 0,
    module: route24
  },
  "routes/api.traffic": {
    id: "routes/api.traffic",
    parentId: "root",
    path: "api/traffic",
    index: void 0,
    caseSensitive: void 0,
    module: route25
  },
  "routes/api.geocode": {
    id: "routes/api.geocode",
    parentId: "root",
    path: "api/geocode",
    index: void 0,
    caseSensitive: void 0,
    module: route26
  },
  "routes/api.square-checkout": {
    id: "routes/api.square-checkout",
    parentId: "root",
    path: "api/square-checkout",
    index: void 0,
    caseSensitive: void 0,
    module: route27
  },
  "routes/api.square-pay": {
    id: "routes/api.square-pay",
    parentId: "root",
    path: "api/square-pay",
    index: void 0,
    caseSensitive: void 0,
    module: route28
  },
  "routes/api.square-capture": {
    id: "routes/api.square-capture",
    parentId: "root",
    path: "api/square-capture",
    index: void 0,
    caseSensitive: void 0,
    module: route29
  },
  "routes/api.square-payment-details": {
    id: "routes/api.square-payment-details",
    parentId: "root",
    path: "api/square-payment-details",
    index: void 0,
    caseSensitive: void 0,
    module: route30
  },
  "routes/api.square-webhook": {
    id: "routes/api.square-webhook",
    parentId: "root",
    path: "api/square-webhook",
    index: void 0,
    caseSensitive: void 0,
    module: route31
  },
  "routes/payment.success": {
    id: "routes/payment.success",
    parentId: "root",
    path: "payment/success",
    index: void 0,
    caseSensitive: void 0,
    module: route32
  },
  "routes/payment.cancel": {
    id: "routes/payment.cancel",
    parentId: "root",
    path: "payment/cancel",
    index: void 0,
    caseSensitive: void 0,
    module: route33
  },
  "routes/api.$": {
    id: "routes/api.$",
    parentId: "root",
    path: "api/*",
    index: void 0,
    caseSensitive: void 0,
    module: route34
  },
  "routes/home-biz-slug": {
    id: "routes/home-biz-slug",
    parentId: "root",
    path: "biz/:bizSlug",
    index: void 0,
    caseSensitive: void 0,
    module: route36
  },
  "routes/home-slug": {
    id: "routes/home-slug",
    parentId: "root",
    path: ":bizSlug",
    index: void 0,
    caseSensitive: void 0,
    module: route36
  }
};
const allowedActionOrigins = false;
export {
  allowedActionOrigins,
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
