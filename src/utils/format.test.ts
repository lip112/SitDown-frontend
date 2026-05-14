import { describe, expect, it } from 'vitest';
import {
  categoryLabel,
  formatDateTime,
  formatMinutes,
  getCongestionMeta,
  normalizePage,
  toApiLocalDateTime,
} from './format';

describe('format utilities', () => {
  it('formats minutes into Korean hour and minute text', () => {
    expect(formatMinutes(0)).toBe('0분');
    expect(formatMinutes(45)).toBe('45분');
    expect(formatMinutes(135)).toBe('2시간 15분');
  });

  it('maps backend enum values to user-facing labels and tone', () => {
    expect(categoryLabel('READING_ROOM')).toBe('열람실');
    expect(getCongestionMeta('HIGH')).toEqual({ label: '혼잡', tone: 'danger' });
    expect(getCongestionMeta(undefined)).toEqual({ label: '정보 없음', tone: 'neutral' });
  });

  it('formats API date strings and datetime-local values predictably', () => {
    expect(formatDateTime('2026-05-14T09:30:00+09:00')).toContain('2026.');
    expect(toApiLocalDateTime('2026-05-14T09:30')).toBe('2026-05-14T09:30:00');
    expect(toApiLocalDateTime('')).toBe('');
  });

  it('normalizes missing pagination fields without changing content', () => {
    const page = normalizePage({ content: [{ id: 'space-1' }], page: 2 });

    expect(page).toEqual({
      content: [{ id: 'space-1' }],
      page: 2,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
    });
  });
});
