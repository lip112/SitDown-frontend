import { getCongestionMeta, reservationStatusLabel } from '../utils/format';

export function CongestionPill({ level }: { level?: string }) {
  const meta = getCongestionMeta(level);
  return <span className={`pill pill-${meta.tone}`}>{meta.label}</span>;
}

export function ReservationPill({ status }: { status: string }) {
  const tone = status === 'IN_USE' ? 'success' : status === 'CANCELED' || status === 'NO_SHOW' ? 'neutral' : 'warning';
  return <span className={`pill pill-${tone}`}>{reservationStatusLabel(status)}</span>;
}
