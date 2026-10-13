import { STATUS_META } from '@/data/dispatch';
import { normalizeStatus } from '@/lib/reservation';

export function StatusBadge({ value, size = 'md' }: { value: unknown; size?: 'sm' | 'md' }) {
  const status = normalizeStatus(value);
  const meta = STATUS_META[status];
  return (
    <span className={`status-chip ${meta.chip}${size === 'sm' ? ' status-chip-sm' : ''}`}>
      <span className="status-dot" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}
