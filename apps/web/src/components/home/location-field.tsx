import { useEffect, useId, useRef, useState } from 'react';
import { Check, MapPin, Plane, Search } from 'lucide-react';

type Suggestion = {
  placeId: string;
  description: string;
  main: string;
  secondary: string;
  type: 'airport' | 'place';
  lat?: number;
  lng?: number;
};

type GeocodeResult = {
  verified: boolean;
  configured: boolean;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Reports the verified coordinates of the chosen/verified address so the
   *  route map renders from the exact selected location. `null` = unverified. */
  onCoords?: (coords: { lat: number; lng: number } | null) => void;
  placeholder: string;
  ariaLabel: string;
  marker: 'pickup' | 'dropoff' | 'stop';
  mapsConfigured: boolean;
};

/**
 * Address input with live suggestions. The typed text stays as the customer
 * wrote it until they pick a suggestion — picking writes the verified
 * formatted address. Suggestions are limited to the typed house number,
 * street, city, and state, so a different address is never offered as a match.
 * Airport names such as LaGuardia still resolve. The Maps key never reaches
 * the browser.
 */
export function LocationField({ value, onChange, onCoords, placeholder, ariaLabel, marker }: Props) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [outOfArea, setOutOfArea] = useState(false);
  const listId = useId();
  const blurTimer = useRef<number | undefined>(undefined);
  const verifyController = useRef<AbortController | null>(null);
  const fetchController = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Set when a suggestion is chosen (which verifies itself), so the input's
  // blur handler doesn't fire a second, redundant verification.
  const skipBlurVerify = useRef(false);
  // Coordinates from the chosen suggestion, so a later verification miss
  // never clears coordinates the customer already picked.
  const chosenCoords = useRef<{ lat: number; lng: number } | null>(null);

  // Keep the input in sync when the parent resets the draft (e.g. "Book
  // another"). Only mirror `value` into `query` here — do NOT clear
  // suggestions/verified/activeIndex on every value change, because each
  // keystroke flows back through onChange as a new `value` and would wipe the
  // suggestion list mid-typing and clobber the verified badge right after
  // geocode sets it. Clearing is reserved for a true external reset (value
  // becomes empty); typing clears `verified` in the onChange handler and the
  // fetch effect manages the suggestion list.
  useEffect(() => {
    setQuery(value);
    if (!value) {
      setVerified(false);
      setSuggestions([]);
      setActiveIndex(-1);
      chosenCoords.current = null;
    }
  }, [value]);

  // Fetch suggestions whenever the query changes while focused. Suggestions
  // are always requested for any query of 2+ characters — including when the
  // customer re-focuses an already-filled field to edit it — so autocomplete
  // stays reliable on every device and screen size.
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
      fetch(`/api/places-autocomplete?input=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
        .then(res => {
          if (!res.ok) throw new Error(`${res.status}`);
          return res.json();
        })
        .then((data: { suggestions: Suggestion[]; outOfArea?: boolean }) => {
          setSuggestions(data.suggestions ?? []);
          setOutOfArea(Boolean(data.outOfArea));
          setActiveIndex(-1);
        })
        .catch(err => {
          if (err?.name === 'AbortError') return;
          setSuggestions([]);
          setError(true);
        })
        .finally(() => setLoading(false));
    }, 200);

    return () => {
      window.clearTimeout(debounce);
      controller.abort();
    };
  }, [query, focused]);

  // Confirm the address without replacing what the customer typed. The field
  // keeps their text until they choose a suggestion; choosing is what writes
  // the verified formatted address. A geocode hit for a different place is
  // not applied.
  function verify(address: string) {
    if (verifyController.current) verifyController.current.abort();
    if (address.trim().length < 5) {
      setVerified(false);
      return;
    }
    setVerifying(true);
    const controller = new AbortController();
    verifyController.current = controller;
    fetch(`/api/geocode?address=${encodeURIComponent(address)}`, { signal: controller.signal })
      .then(res => res.json())
      .then((data: GeocodeResult) => {
        if (controller.signal.aborted) return;
        const ok = Boolean(data.verified && data.formattedAddress);
        setVerified(ok);
        if (ok && typeof data.lat === 'number' && typeof data.lng === 'number') {
          chosenCoords.current = { lat: data.lat, lng: data.lng };
          onCoords?.({ lat: data.lat, lng: data.lng });
        } else if (!ok && !chosenCoords.current) {
          onCoords?.(null);
        }
      })
      .catch(() => {
        setVerified(false);
        if (!chosenCoords.current) onCoords?.(null);
      })
      .finally(() => setVerifying(false));
  }

  function choose(s: Suggestion) {
    setQuery(s.description);
    onChange(s.description);
    const coords = typeof s.lat === 'number' && typeof s.lng === 'number' ? { lat: s.lat, lng: s.lng } : null;
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
      // The customer typed a full address but didn't pick a suggestion —
      // verify and normalize it anyway, so a completely typed address is
      // recognized and canonicalized instead of staying unrecognized.
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

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList && e.key !== 'Escape') return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        choose(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        // Nothing highlighted: Enter accepts the top suggestion, so a fully
        // typed address is recognized with one keypress.
        e.preventDefault();
        choose(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="field-row booking-row" style={{ position: 'relative', flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: 0, height: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '13px', minHeight: '53px', padding: '0 17px', width: '100%' }}>
        {marker === 'pickup' ? <span className="pickup-marker" /> : marker === 'stop' ? <span className="stop-marker" /> : <span className="dropoff-marker" />}
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setVerified(false); chosenCoords.current = null; onCoords?.(null); }}
          onFocus={() => { setFocused(true); }}
          onBlur={clearBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          aria-activedescendant={showList && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          maxLength={300}
          style={{ flex: 1, minWidth: 0, background: 'transparent', outline: 'none', border: 0, color: 'var(--ink)', height: '50px' }}
        />
        {verifying ? (
          <Search size={16} className="row-end" style={{ animation: 'spin 1s linear infinite' }} />
        ) : verified ? (
          <span className="verified-badge" title="Address verified"><Check size={15} strokeWidth={3} /> Verified</span>
        ) : loading ? (
          <Search size={16} className="row-end" style={{ animation: 'spin 1s linear infinite' }} />
        ) : null}
      </div>
      {showList && (
        <ul id={listId} role="listbox" aria-label={ariaLabel} className="autocomplete-list" onMouseDown={e => e.preventDefault()}>
          {suggestions.map((s, i) => (
            <li key={`${s.placeId || s.description}-${i}`} id={`${listId}-${i}`} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                className={`autocomplete-item ${i === activeIndex ? 'active' : ''}`}
                onMouseDown={() => choose(s)}
                onMouseEnter={() => { cancelBlur(); setActiveIndex(i); }}
                onMouseLeave={() => setActiveIndex(-1)}
                onFocus={cancelBlur}
              >
                <span className="autocomplete-icon">{s.type === 'airport' ? <Plane size={16} /> : <MapPin size={16} />}</span>
                <span className="autocomplete-copy">
                  <strong>{s.main || s.description}</strong>
                  {s.secondary && <small>{s.secondary}</small>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {focused && query.trim().length >= 2 && !loading && suggestions.length === 0 && !error && (
        <div className="autocomplete-hint">
          {outOfArea
            ? 'We currently serve the New York, New Jersey, and Connecticut area only. Please enter an address within our service area.'
            : 'No matching address in our service area (New York, New Jersey, Connecticut). Type the house number, street, city, and state, or pick a suggestion. Airport names like LaGuardia still work.'}
        </div>
      )}
      {focused && error && (
        <div className="autocomplete-hint" style={{ color: '#b5333b', background: '#fdeeee', borderColor: '#f3d2d4' }}>
          Couldn’t load address suggestions. Check your connection and try again.
        </div>
      )}
    </div>
  );
}
