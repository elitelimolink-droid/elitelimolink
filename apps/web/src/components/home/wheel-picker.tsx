import { useEffect, useRef } from 'react';

export type WheelItem = { value: string; label: string; disabled?: boolean };

type Props = {
  items: WheelItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  itemHeight?: number;
};

/**
 * A drum-style rotary wheel: the customer spins the column with touch or
 * mouse (native momentum scrolling) and the item that lands in the center
 * band becomes the selection. Tapping an item jumps it to the center.
 */
export function WheelPicker({ items, value, onChange, ariaLabel, itemHeight = 44 }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  // The last value this wheel itself emitted, so externally forced changes
  // (e.g. clamping) re-center the drum while user scrolls do not fight it.
  const emitted = useRef<string | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Cancel a pending scroll-settle when the wheel unmounts (modal closed).
  useEffect(() => () => clearTimeout(settle.current), []);

  const selectedIndex = Math.max(0, items.findIndex(item => item.value === value));

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const index = Math.max(0, items.findIndex(item => item.value === value));
    if (emitted.current !== value) list.scrollTop = index * itemHeight;
  }, [value, items, itemHeight]);

  function nearestEnabledIndex(index: number) {
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

  function jumpTo(index: number) {
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

  return (
    <div className="wheel-picker" role="group" aria-label={ariaLabel}>
      <div className="wheel-highlight" aria-hidden="true" />
      <div className="wheel-scroll" ref={listRef} onScroll={handleScroll}>
        {items.map((item, index) => (
          <button
            key={item.value}
            type="button"
            disabled={item.disabled}
            className={`wheel-item ${index === selectedIndex ? 'active' : ''}`}
            style={{ height: itemHeight }}
            aria-current={index === selectedIndex}
            onClick={() => jumpTo(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
