export interface ReservationPolicy {
  openTime: string;
  closeTime: string;
  maxReservationHours: number;
}

export function formatSecondsAsClock(seconds: number): string {
  const safeSeconds = Math.max(Math.floor(seconds), 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export function getDurationMinutes(startAt: string, endAt: string): number {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

export function validateReservationWindow(
  startAt: string,
  endAt: string,
  policy: ReservationPolicy,
): string | null {
  const durationMinutes = getDurationMinutes(startAt, endAt);

  if (durationMinutes <= 0) {
    return '종료 시간은 시작 시간보다 늦어야 합니다.';
  }

  if (!isWithinOperatingHours(startAt, endAt, policy.openTime, policy.closeTime)) {
    return '운영 시간 안에서만 예약할 수 있습니다.';
  }

  const maxMinutes = policy.maxReservationHours * 60;
  if (durationMinutes > maxMinutes) {
    return `최대 이용 시간은 ${policy.maxReservationHours}시간입니다.`;
  }

  return null;
}

function isWithinOperatingHours(startAt: string, endAt: string, openTime: string, closeTime: string): boolean {
  const startDate = startAt.slice(0, 10);
  const endDate = endAt.slice(0, 10);
  if (!startDate || startDate !== endDate) {
    return false;
  }

  const startMinute = timePartToMinutes(startAt.slice(11, 16));
  const endMinute = timePartToMinutes(endAt.slice(11, 16));
  const openMinute = timePartToMinutes(openTime.slice(0, 5));
  const closeMinute = timePartToMinutes(closeTime.slice(0, 5));

  return startMinute >= openMinute && endMinute <= closeMinute;
}

function timePartToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}
