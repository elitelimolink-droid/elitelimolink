import { useEffect, useRef } from 'react';
import { Moon, Sun, SunMoon } from 'lucide-react';

const STORAGE_KEY = 'theme';

type Mode = 'auto' | 'light' | 'dark';

/**
 * Reads the active appearance mode from the `data-theme-mode` attribute that
 * the no-flash script in `root.tsx` sets before paint. Falls back to `auto`
 * (follow the device) when the attribute is missing or unrecognized.
 */
function readMode(): Mode {
  if (typeof document === 'undefined') return 'auto';
  const m = document.documentElement.getAttribute('data-theme-mode');
  return m === 'light' || m === 'dark' ? m : 'auto';
}

/**
 * Applies a mode: persists the choice, updates the `data-theme-mode` attribute
 * (which drives the icon via CSS), and toggles `html.dark` to match. In `auto`
 * mode the effective appearance is resolved from the device preference, so it
 * keeps following the device until a manual choice overrides it.
 */
function applyMode(next: Mode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme-mode', next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // localStorage may be unavailable (private mode) — the in-memory class
    // toggle still applies for the rest of the session.
  }
  const dark =
    next === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : next === 'dark';
  root.classList.toggle('dark', dark);
}

const LABELS: Record<Mode, string> = {
  auto: 'Auto appearance — follows device. Click for light mode.',
  light: 'Light mode. Click for dark mode.',
  dark: 'Dark mode. Click for auto (follow device).',
};

/**
 * Accessible appearance control with three states: Auto (follow the device,
 * including live changes), Light, and Dark. Clicking cycles through them, so a
 * visitor can override the device setting and then return to automatic mode
 * without clearing any saved choice.
 *
 * The visible icon is driven entirely by the `html.dark` class and
 * `data-theme-mode` attribute via CSS, so there is no React state and no
 * hydration mismatch — the no-flash script in `root.tsx` sets both before
 * paint, a `matchMedia` listener keeps following the device while in auto mode,
 * and this button only flips the mode.
 */
export function ThemeToggle({
  className = 'theme-toggle',
  label = 'Toggle day or night mode',
}: {
  className?: string;
  label?: string;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);

  // Keep the accessible label in sync with the active mode. The icon itself is
  // CSS-driven, but the label needs to reflect manual/auto state, so update it
  // on mount and whenever the device preference or another tab changes it.
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const sync = () => {
      const m = readMode();
      btn.setAttribute('aria-label', LABELS[m]);
      btn.setAttribute('title', LABELS[m]);
    };
    sync();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onDevice = () => sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) sync();
    };
    mq.addEventListener('change', onDevice);
    window.addEventListener('storage', onStorage);
    return () => {
      mq.removeEventListener('change', onDevice);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  function toggle() {
    const cur = readMode();
    const next: Mode = cur === 'auto' ? 'light' : cur === 'light' ? 'dark' : 'auto';
    applyMode(next);
    const btn = btnRef.current;
    if (btn) {
      btn.setAttribute('aria-label', LABELS[next]);
      btn.setAttribute('title', LABELS[next]);
    }
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      title={label}
      onClick={toggle}
      ref={btnRef}
    >
      <SunMoon className="theme-icon theme-icon-auto" strokeWidth={2.2} />
      <Sun className="theme-icon theme-icon-sun" strokeWidth={2.2} />
      <Moon className="theme-icon theme-icon-moon" strokeWidth={2.2} />
    </button>
  );
}
