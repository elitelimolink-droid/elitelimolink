/**
 * Service area: this operator serves the tri-state area — New York, New
 * Jersey, and Connecticut. Every address lookup (autocomplete, geocode,
 * route resolution) filters its results through these helpers so an address
 * outside the service area is never suggested, verified, or mapped.
 */

export const SERVICE_STATES = ['NY', 'NJ', 'CT'] as const;
export type ServiceState = (typeof SERVICE_STATES)[number];

const SERVICE_STATE_SET = new Set<string>(SERVICE_STATES.map((s) => s.toLowerCase()));

const STATE_NAME_TO_ABBR: Record<string, string> = {
	'new york': 'ny',
	'new jersey': 'nj',
	connecticut: 'ct',
};

/** Normalize a state abbreviation or full name ("NY" / "New York") to the
 * lowercase abbreviation, or null when it is not a state we serve. */
export function serviceStateAbbr(value: string | null | undefined): string | null {
	if (!value) return null;
	const v = value.trim().toLowerCase();
	if (!v) return null;
	if (SERVICE_STATE_SET.has(v)) return v;
	return STATE_NAME_TO_ABBR[v] ?? null;
}

/** True only for New York / New Jersey / Connecticut. */
export function isServiceState(abbr: string | null | undefined): boolean {
	return serviceStateAbbr(abbr) !== null;
}

/** Pull a US state out of a single-line address such as
 * "30-25 71st St, Elmhurst, NY, 11370" or "…, New Jersey, 07102". */
export function serviceStateFromText(text: string): string | null {
	for (const part of text.split(',')) {
		const trimmed = part.trim();
		if (!trimmed) continue;
		const first = serviceStateAbbr(trimmed.split(/\s+/)[0]);
		if (first) return first;
		const full = serviceStateAbbr(trimmed);
		if (full) return full;
	}
	return null;
}

/** True when the address text carries a NY / NJ / CT state token. */
export function textInServiceArea(text: string): boolean {
	return serviceStateFromText(text) !== null;
}

/** Airports inside the NY / NJ / CT service area (IATA codes). */
export const SERVICE_AREA_AIRPORT_CODES = new Set([
	'JFK', 'LGA', 'EWR', // major NYC-area gateways
	'HPN', 'ISP', 'FRG', 'SWF', // New York regionals
	'TEB', 'MMU', 'CDW', // New Jersey regionals
	'BDL', 'HVN', 'OXC', 'GON', 'DXR', // Connecticut regionals
	'ALB', 'BUF', 'ROC', 'SYR', 'ITH', // upstate New York
]);
