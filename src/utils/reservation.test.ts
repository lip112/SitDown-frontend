import { describe, expect, it } from 'vitest';
import { formatSecondsAsClock, getDurationMinutes, validateReservationWindow } from './reservation';

describe('reservation utilities', () => {
  it('formats remaining seconds as HH:MM:SS', () => {
    expect(formatSecondsAsClock(0)).toBe('00:00:00');
    expect(formatSecondsAsClock(65)).toBe('00:01:05');
    expect(formatSecondsAsClock(3661)).toBe('01:01:01');
  });

  it('calculates reservation duration from datetime-local inputs', () => {
    expect(getDurationMinutes('2026-05-15T09:30', '2026-05-15T11:00')).toBe(90);
  });

  it('validates end time, operating hours, and max reservation duration', () => {
    const policy = { openTime: '09:00:00', closeTime: '18:00:00', maxReservationHours: 4 };

    expect(validateReservationWindow('2026-05-15T10:00', '2026-05-15T12:00', policy)).toBeNull();
    expect(validateReservationWindow('2026-05-15T12:00', '2026-05-15T10:00', policy)).toBe('종료 시간은 시작 시간보다 늦어야 합니다.');
    expect(validateReservationWindow('2026-05-15T08:30', '2026-05-15T10:00', policy)).toBe('운영 시간 안에서만 예약할 수 있습니다.');
    expect(validateReservationWindow('2026-05-15T10:00', '2026-05-15T15:00', policy)).toBe('최대 이용 시간은 4시간입니다.');
  });
});
