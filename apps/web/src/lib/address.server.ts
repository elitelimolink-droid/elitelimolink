/**
 * US street-address normalization, relevance filtering, and lookup.
 *
 * Queens-style numbers ("30 25 71st east Elmhurst") are a common typed
 * variation of "30-25 71st Street, East Elmhurst, NY". Loose geocoders turn
 * that into a different street or city. This module rewrites the obvious
 * variations, asks the US Census geocoder and ArcGIS, and drops any hit that
 * does not share the typed house number, street, city, and state.
 */
import type { AutocompleteSuggestion } from '@/lib/airports';
import { isServiceState, serviceStateAbbr, textInServiceArea } from '@/lib/service-area';

const UA = 'BJKLimoRideBook/1.0 (ride-booking; contact@bjklimo.local)';

const SUFFIXES = new Set([
	'st', 'street', 'str',
	'ave', 'avenue', 'av',
	'blvd', 'boulevard',
	'rd', 'road',
	'dr', 'drive',
	'ln', 'lane',
	'ct', 'court',
	'pl', 'place',
	'ter', 'terrace', 'terr',
	'pkwy', 'parkway',
	'hwy', 'highway',
	'cir', 'circle',
	'way',
	'trl', 'trail',
]);

const SUFFIX_EXPAND: Record<string, string> = {
	st: 'Street', street: 'Street', str: 'Street',
	ave: 'Avenue', avenue: 'Avenue', av: 'Avenue',
	blvd: 'Boulevard', boulevard: 'Boulevard',
	rd: 'Road', road: 'Road',
	dr: 'Drive', drive: 'Drive',
	ln: 'Lane', lane: 'Lane',
	ct: 'Court', court: 'Court',
	pl: 'Place', place: 'Place',
	ter: 'Terrace', terrace: 'Terrace', terr: 'Terrace',
	pkwy: 'Parkway', parkway: 'Parkway',
	hwy: 'Highway', highway: 'Highway',
	cir: 'Circle', circle: 'Circle',
	way: 'Way',
	trl: 'Trail', trail: 'Trail',
};

const STATE_ABBRS = new Set([
	'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'dc', 'de', 'fl', 'ga', 'hi', 'ia', 'id', 'il', 'in',
	'ks', 'ky', 'la', 'ma', 'md', 'me', 'mi', 'mn', 'mo', 'ms', 'mt', 'nc', 'nd', 'ne', 'nh', 'nj',
	'nm', 'nv', 'ny', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'va', 'vt', 'wa',
	'wi', 'wv', 'wy',
]);

const STATE_FULL: Record<string, string> = {
	al: 'alabama', ak: 'alaska', az: 'arizona', ar: 'arkansas', ca: 'california', co: 'colorado',
	ct: 'connecticut', dc: 'district of columbia', de: 'delaware', fl: 'florida', ga: 'georgia',
	hi: 'hawaii', ia: 'iowa', id: 'idaho', il: 'illinois', in: 'indiana', ks: 'kansas', ky: 'kentucky',
	la: 'louisiana', ma: 'massachusetts', md: 'maryland', me: 'maine', mi: 'michigan', mn: 'minnesota',
	mo: 'missouri', ms: 'mississippi', mt: 'montana', nc: 'north carolina', nd: 'north dakota',
	ne: 'nebraska', nh: 'new hampshire', nj: 'new jersey', nm: 'new mexico', nv: 'nevada',
	ny: 'new york', oh: 'ohio', ok: 'oklahoma', or: 'oregon', pa: 'pennsylvania', ri: 'rhode island',
	sc: 'south carolina', sd: 'south dakota', tn: 'tennessee', tx: 'texas', ut: 'utah', va: 'virginia',
	vt: 'vermont', wa: 'washington', wi: 'wisconsin', wv: 'west virginia', wy: 'wyoming',
};

const STATE_FROM_NAME: Record<string, string> = Object.fromEntries(
	Object.entries(STATE_FULL).map(([abbr, name]) => [name, abbr]),
);

export type AddressIntent = {
	raw: string;
	house: string | null;
	streetOrdinal: string | null;
	streetSuffix: string | null;
	streetName: string | null;
	city: string | null;
	state: string | null;
};

export type StreetHit = {
	formattedAddress: string;
	main: string;
	secondary: string;
	lat: number;
	lng: number;
	source: 'census' | 'arcgis' | 'photon';
};

const cache = new Map<string, { at: number; hits: StreetHit[] }>();
const CACHE_TTL = 10 * 60 * 1000;

function escapeReg(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isSuffix(token: string): boolean {
	return SUFFIXES.has(token.toLowerCase().replace(/\./g, ''));
}

function ordinalNumber(token: string): string | null {
	const match = token.match(/^(\d+)(st|nd|rd|th)$/i);
	return match ? match[1] : null;
}

function ordinalSuffix(n: string): string {
	const num = Number(n);
	const mod100 = num % 100;
	if (mod100 >= 11 && mod100 <= 13) return 'th';
	switch (num % 10) {
		case 1: return 'st';
		case 2: return 'nd';
		case 3: return 'rd';
		default: return 'th';
	}
}

function titleCase(value: string): string {
	return value
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

function tokenize(input: string): string[] {
	return input
		.trim()
		.replace(/[#.,]/g, ' ')
		.replace(/[–—]/g, '-')
		.replace(/\s+/g, ' ')
		.split(' ')
		.filter(Boolean);
}

/** Pull house number, street, city, and state out of a typed address. */
export function parseAddressIntent(input: string): AddressIntent {
	let tokens = tokenize(input);
	if (/^\d{5}(?:-\d{4})?$/.test(tokens[tokens.length - 1] ?? '')) tokens = tokens.slice(0, -1);

	let state: string | null = null;
	const last = (tokens[tokens.length - 1] ?? '').toLowerCase();
	const lastTwo = tokens.slice(-2).join(' ').toLowerCase();
	if (STATE_FROM_NAME[lastTwo]) {
		state = STATE_FROM_NAME[lastTwo];
		tokens = tokens.slice(0, -2);
	} else if (STATE_ABBRS.has(last)) {
		state = last;
		tokens = tokens.slice(0, -1);
	}

	let house: string | null = null;
	const hyphen = tokens[0]?.match(/^(\d{1,5})-(\d{1,5})$/);
	const third = tokens[2] ?? '';
	if (hyphen) {
		house = `${hyphen[1]}-${hyphen[2]}`;
		tokens = tokens.slice(1);
	} else if (
		/^\d{1,5}$/.test(tokens[0] ?? '') &&
		/^\d{1,3}$/.test(tokens[1] ?? '') &&
		/^\d{1,3}(?:st|nd|rd|th)?$/i.test(third)
	) {
		// "30 25 71st" / "30 25 71 st" — Queens block-lot, not house 30 on 25th.
		house = `${tokens[0]}-${tokens[1]}`;
		tokens = tokens.slice(2);
	} else if (/^\d{1,6}$/.test(tokens[0] ?? '')) {
		house = tokens[0];
		tokens = tokens.slice(1);
	}

	let streetOrdinal: string | null = null;
	let streetSuffix: string | null = null;
	let streetName: string | null = null;

	const leadingOrdinal = ordinalNumber(tokens[0] ?? '');
	const leadingBareStreet =
		/^\d{1,4}$/.test(tokens[0] ?? '') && (isSuffix(tokens[1] ?? '') || Boolean(house?.includes('-')));
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
			streetName = words.length ? words.join(' ') : null;
		} else if (!/^\d+$/.test(tokens[0] ?? '')) {
			streetName = tokens[0];
			tokens = tokens.slice(1);
		}
	}

	const city = tokens.length ? tokens.join(' ') : null;
	return {
		raw: input.trim(),
		house,
		streetOrdinal,
		streetSuffix,
		streetName,
		city,
		state,
	};
}

/** A specific street address, as opposed to an airport or landmark name. */
export function isStreetQuery(intent: AddressIntent): boolean {
	return Boolean(intent.house && (intent.streetOrdinal || intent.streetName));
}

/** Canonical search string for geocoders that misread "30 25 71st east Elmhurst". */
export function normalizedSearchQuery(intent: AddressIntent): string | null {
	if (!intent.house || (!intent.streetOrdinal && !intent.streetName)) return null;
	let street = '';
	if (intent.streetOrdinal) {
		const type = intent.streetSuffix
			? SUFFIX_EXPAND[intent.streetSuffix] ?? 'Street'
			: intent.house.includes('-')
				? 'Street'
				: '';
		const pre = intent.streetName ? `${titleCase(intent.streetName)} ` : '';
		street = `${pre}${intent.streetOrdinal}${ordinalSuffix(intent.streetOrdinal)}${type ? ` ${type}` : ''}`.trim();
	} else if (intent.streetName) {
		const type = intent.streetSuffix ? SUFFIX_EXPAND[intent.streetSuffix] ?? '' : '';
		street = `${titleCase(intent.streetName)}${type ? ` ${type}` : ''}`;
	}
	const city = intent.city ? titleCase(intent.city) : '';
	const state = intent.state ? intent.state.toUpperCase() : '';
	return [`${intent.house} ${street}`.replace(/\s+/g, ' '), city, state].filter(Boolean).join(', ');
}

export function suggestionMatchesIntent(text: string, intent: AddressIntent): boolean {
	const c = ` ${text.toLowerCase().replace(/[#.,]/g, ' ').replace(/[–—]/g, '-').replace(/\s+/g, ' ')} `;

	if (intent.house) {
		if (intent.house.includes('-')) {
			const [a, b] = intent.house.split('-');
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

/** True when the typed house number appears in a geocoded text. Queens-style
 *  hyphenated numbers ("30-25") match hyphenated or spaced forms. Used to gate
 *  the general geocoder fallback so a different address is never verified. */
export function houseNumberInText(text: string, house: string | null): boolean {
	if (!house) return true;
	const c = ` ${text.toLowerCase().replace(/[#.,]/g, ' ').replace(/[–—]/g, '-').replace(/\s+/g, ' ')} `;
	if (house.includes('-')) {
		const [a, b] = house.split('-');
		const hyphenated = new RegExp(`\\b${a}\\s*-\\s*${b}\\b`).test(c);
		const spaced = new RegExp(`\\b${a}\\s+${b}\\b`).test(c);
		return hyphenated || spaced;
	}
	return new RegExp(`\\b${escapeReg(house)}\\b`).test(c);
}

function titleCasePart(part: string): string {
	return part
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => {
			if (/^\d{5}(?:-\d{4})?$/.test(word)) return word;
			if (/^[A-Za-z]{2}$/.test(word) && STATE_ABBRS.has(word.toLowerCase())) return word.toUpperCase();
			const ord = word.match(/^(\d+)(st|nd|rd|th)$/i);
			if (ord) return `${ord[1]}${ord[2].toLowerCase()}`;
			if (/^\d+-\d+$/.test(word)) return word;
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		})
		.join(' ');
}

function presentAddress(raw: string): { main: string; secondary: string; description: string } {
	let parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
	if (/^(usa|u\.s\.a\.|united states)$/i.test(parts[parts.length - 1] ?? '')) parts.pop();
	parts = parts.map(titleCasePart);
	if (parts[0]) {
		parts[0] = parts[0].replace(/\b(St|Ave|Blvd|Rd|Dr|Ln|Ct|Pl|Ter|Pkwy|Hwy|Cir|Trl)\b$/, (suffix) => {
			return SUFFIX_EXPAND[suffix.toLowerCase()] ?? suffix;
		});
	}
	if (
		parts.length >= 2 &&
		/^[A-Z]{2}$/.test(parts[parts.length - 2] ?? '') &&
		/^\d{5}/.test(parts[parts.length - 1] ?? '')
	) {
		const zip = parts.pop() as string;
		parts[parts.length - 1] = `${parts[parts.length - 1]} ${zip}`;
	}
	const main = parts[0] || raw;
	const secondary = parts.slice(1).join(', ');
	return { main, secondary, description: secondary ? `${main}, ${secondary}` : main };
}

function dedupeKey(text: string): string {
	const house = text.match(/\b(\d{1,5})\s*[-–]\s*(\d{1,5})\b/) ?? text.match(/\b(\d{1,6})\b/);
	const ord = text.match(/\b(\d+)(?:st|nd|rd|th)\b/i);
	const zip = text.match(/\b(\d{5})\b/);
	if (house && ord) {
		const houseKey = house[2] ? `${house[1]}-${house[2]}` : house[1];
		return `${houseKey}|${ord[1]}|${zip?.[1] ?? ''}`;
	}
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function rank(hit: StreetHit, intent: AddressIntent): number {
	let score = 0;
	if (hit.source === 'census') score += 40;
	if (hit.source === 'arcgis') score += 20;
	if (intent.house?.includes('-') && hit.formattedAddress.includes(intent.house)) score += 30;
	if (intent.city && suggestionMatchesIntent(hit.formattedAddress, intent)) score += 10;
	return score;
}

function remember(key: string, hits: StreetHit[]): StreetHit[] {
	if (cache.size > 200) {
		const oldest = cache.keys().next().value;
		if (oldest) cache.delete(oldest);
	}
	cache.set(key, { at: Date.now(), hits });
	return hits;
}

function cached(key: string): StreetHit[] | null {
	const row = cache.get(key);
	if (!row) return null;
	if (Date.now() - row.at > CACHE_TTL) {
		cache.delete(key);
		return null;
	}
	return row.hits;
}

async function censusLookup(query: string, signal?: AbortSignal): Promise<StreetHit[]> {
	const key = `census:${query.toLowerCase()}`;
	const hit = cached(key);
	if (hit) return hit;
	try {
		const res = await fetch(
			`https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(query)}&benchmark=Public_AR_Current&format=json`,
			{ signal, headers: { 'User-Agent': UA, Accept: 'application/json' } },
		);
		if (!res.ok) return [];
		const data = (await res.json()) as {
			result?: { addressMatches?: { matchedAddress?: string; coordinates?: { x?: number; y?: number } }[] };
		};
		const hits: StreetHit[] = [];
		for (const match of data.result?.addressMatches ?? []) {
			const lat = match.coordinates?.y;
			const lng = match.coordinates?.x;
			if (!match.matchedAddress || typeof lat !== 'number' || typeof lng !== 'number') continue;
			const presented = presentAddress(match.matchedAddress);
			hits.push({ ...presented, formattedAddress: presented.description, lat, lng, source: 'census' });
		}
		// Service area: keep only New York / New Jersey / Connecticut matches.
		return remember(key, hits.filter((hit) => textInServiceArea(hit.formattedAddress)));
	} catch {
		return [];
	}
}

async function arcgisFind(query: string, signal?: AbortSignal): Promise<StreetHit[]> {
	const key = `arcgis:${query.toLowerCase()}`;
	const hit = cached(key);
	if (hit) return hit;
	try {
		const res = await fetch(
			`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&maxLocations=8&singleLine=${encodeURIComponent(query)}`,
			{ signal, headers: { 'User-Agent': UA, Accept: 'application/json' } },
		);
		if (!res.ok) return [];
		const data = (await res.json()) as {
			candidates?: { address?: string; score?: number; location?: { x?: number; y?: number } }[];
		};
		const hits: StreetHit[] = [];
		for (const candidate of data.candidates ?? []) {
			const lat = candidate.location?.y;
			const lng = candidate.location?.x;
			if (!candidate.address || typeof lat !== 'number' || typeof lng !== 'number') continue;
			if (typeof candidate.score === 'number' && candidate.score < 80) continue;
			const presented = presentAddress(candidate.address);
			hits.push({ ...presented, formattedAddress: presented.description, lat, lng, source: 'arcgis' });
		}
		// Service area: keep only New York / New Jersey / Connecticut matches.
		return remember(key, hits.filter((hit) => textInServiceArea(hit.formattedAddress)));
	} catch {
		return [];
	}
}

type PhotonFeature = {
	geometry?: { coordinates?: [number, number] };
	properties?: {
		name?: string;
		housenumber?: string;
		street?: string;
		city?: string;
		district?: string;
		county?: string;
		state?: string;
		postcode?: string;
		country?: string;
		locality?: string;
	};
};

async function photonLookup(query: string, signal?: AbortSignal): Promise<StreetHit[]> {
	try {
		const res = await fetch(
			`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`,
			{ signal, headers: { 'User-Agent': UA } },
		);
		if (!res.ok) return [];
		const data = (await res.json()) as { features?: PhotonFeature[] };
		const hits: StreetHit[] = [];
		for (const feature of data.features ?? []) {
			const coords = feature.geometry?.coordinates;
			const props = feature.properties ?? {};
			// Service area: only New York / New Jersey / Connecticut results.
			if (!serviceStateAbbr(props.state)) continue;
			if (!coords || coords.length < 2 || !props.housenumber || !props.street) continue;
			const city = props.locality || props.district || props.city || '';
			const raw = [props.housenumber, props.street, city, props.state, props.postcode].filter(Boolean).join(', ');
			const presented = presentAddress(raw);
			hits.push({
				...presented,
				formattedAddress: presented.description,
				lat: coords[1],
				lng: coords[0],
				source: 'photon',
			});
		}
		return hits;
	} catch {
		return [];
	}
}

function queriesFor(input: string, intent: AddressIntent): string[] {
	const normalized = normalizedSearchQuery(intent);
	const queries = [input.trim()];
	if (normalized && normalized.toLowerCase() !== input.trim().toLowerCase()) queries.push(normalized);
	return queries;
}

function relevantHits(hits: StreetHit[], intent: AddressIntent): StreetHit[] {
	const seen = new Set<string>();
	const matched = hits
		.filter((hit) => suggestionMatchesIntent(hit.formattedAddress, intent) || suggestionMatchesIntent(`${hit.main} ${hit.secondary}`, intent))
		.sort((a, b) => rank(b, intent) - rank(a, intent));
	const unique: StreetHit[] = [];
	for (const hit of matched) {
		const key = dedupeKey(hit.formattedAddress);
		if (seen.has(key)) continue;
		seen.add(key);
		unique.push(hit);
	}
	return sameLocality(unique);
}

/** Keep the best hit's city. A same house number in another city is a different address. */
function sameLocality(hits: StreetHit[]): StreetHit[] {
	if (hits.length <= 1) return hits;
	const locality = (hits[0].secondary.split(',')[0] ?? '').trim().toLowerCase();
	if (!locality) return hits;
	const family = hits.filter((hit) => (hit.secondary.split(',')[0] ?? '').trim().toLowerCase() === locality);
	return family.length ? family : hits;
}

/** Best verified street address, or null when nothing matches the typed address. */
export async function lookupStreetAddress(input: string, signal?: AbortSignal): Promise<StreetHit | null> {
	const intent = parseAddressIntent(input);
	if (!isStreetQuery(intent)) return null;
	// Outside the NY / NJ / CT service area — never resolve a different area.
	if (intent.state && !isServiceState(intent.state)) return null;
	const queries = queriesFor(input, intent);
	const batches = await Promise.all(
		queries.flatMap((query) => [censusLookup(query, signal), arcgisFind(query, signal)]),
	);
	let hits = relevantHits(batches.flat(), intent);
	if (!hits.length) {
		const photon = await Promise.all(queries.map((query) => photonLookup(query, signal)));
		hits = relevantHits(photon.flat(), intent);
	}
	return hits[0] ?? null;
}

/**
 * Autocomplete suggestions for a typed street address. Unrelated places are
 * omitted — an empty list is better than offering a different address.
 */
export async function suggestStreetAddresses(
	input: string,
	signal?: AbortSignal,
): Promise<AutocompleteSuggestion[]> {
	const intent = parseAddressIntent(input);
	if (!isStreetQuery(intent)) return [];
	// Outside the NY / NJ / CT service area — never suggest a different area.
	if (intent.state && !isServiceState(intent.state)) return [];
	const queries = queriesFor(input, intent);
	const preferred = queries[queries.length - 1] ?? input;
	const [found, suggested] = await Promise.all([
		Promise.all(queries.flatMap((query) => [censusLookup(query, signal), arcgisFind(query, signal)])),
		arcgisSuggest(preferred, signal),
	]);
	let hits = relevantHits([...found.flat(), ...suggested], intent);
	if (!hits.length) {
		const photon = await Promise.all(queries.map((query) => photonLookup(query, signal)));
		hits = relevantHits(photon.flat(), intent);
	}
	return hits.slice(0, 5).map((hit) => ({
		placeId: `${hit.source}:${hit.lat},${hit.lng}`,
		description: hit.formattedAddress,
		main: hit.main,
		secondary: hit.secondary,
		lat: hit.lat,
		lng: hit.lng,
		type: 'place' as const,
	}));
}

async function arcgisSuggest(query: string, signal?: AbortSignal): Promise<StreetHit[]> {
	try {
		const res = await fetch(
			`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?f=json&maxSuggestions=6&text=${encodeURIComponent(query)}`,
			{ signal, headers: { 'User-Agent': UA, Accept: 'application/json' } },
		);
		if (!res.ok) return [];
		const data = (await res.json()) as { suggestions?: { text?: string; magicKey?: string }[] };
		const texts = (data.suggestions ?? []).map((item) => item.text ?? '').filter(Boolean);
		if (!texts.length) return [];
		// Suggest has no coordinates. Resolve only texts that already match the
		// typed address so a Tulsa/Texarkana lookalike is never geocoded or shown.
		const intent = parseAddressIntent(query);
		const relevant = texts.filter((text) => suggestionMatchesIntent(text, intent));
		const resolved = await Promise.all(relevant.slice(0, 3).map((text) => arcgisFind(text, signal)));
		const hits = resolved.flat().filter((hit) => suggestionMatchesIntent(hit.formattedAddress, intent));
		if (hits.length) return hits;
		// Census can attach coordinates when ArcGIS find is picky about suggest text.
		const census = await Promise.all(relevant.slice(0, 2).map((text) => censusLookup(text, signal)));
		return census.flat();
	} catch {
		return [];
	}
}
