import type { CongestionLevel, PageResponse, SpaceCategory } from '../api/types';

export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes === 0 ? `${hours}시간` : `${hours}시간 ${remainingMinutes}분`;
}

export function categoryLabel(category: SpaceCategory | string | undefined): string {
  const labels: Record<SpaceCategory, string> = {
    READING_ROOM: '열람실',
    STUDY_ROOM: '스터디룸',
    PC_ROOM: 'PC실',
    LECTURE_ROOM: '강의실',
  };

  return category && category in labels ? labels[category as SpaceCategory] : '전체';
}

export function affiliationLabel(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    UNDERGRADUATE: '학부생',
    GRADUATE: '대학원생',
    FACULTY: '교직원',
    ASSISTANT: '조교',
    EXTERNAL: '외부인',
  };

  return value ? labels[value] ?? value : '미지정';
}

export function reservationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    SCHEDULED: '예약 예정',
    IN_USE: '이용 중',
    COMPLETED: '이용 완료',
    CANCELED: '취소됨',
    NO_SHOW: '노쇼',
  };

  return labels[status] ?? status;
}

export function noticeCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    ALL: '전체',
    INFO: '안내',
    MAINTENANCE: '점검',
    EVENT: '이벤트',
  };

  return labels[category] ?? category;
}

export function getCongestionMeta(level: CongestionLevel | string | undefined): {
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
} {
  switch (level) {
    case 'LOW':
      return { label: '여유', tone: 'success' };
    case 'NORMAL':
      return { label: '보통', tone: 'warning' };
    case 'HIGH':
      return { label: '혼잡', tone: 'danger' };
    default:
      return { label: '정보 없음', tone: 'neutral' };
  }
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function toApiLocalDateTime(value: string): string {
  if (!value) {
    return '';
  }

  return value.length === 16 ? `${value}:00` : value;
}

export function toKstOffsetDateTime(value: string): string {
  const localDateTime = toApiLocalDateTime(value);
  return localDateTime ? `${localDateTime}+09:00` : '';
}

export function normalizePage<T>(page: Partial<PageResponse<T>> & { content?: T[] }): PageResponse<T> {
  const content = page.content ?? [];

  return {
    content,
    page: page.page ?? 0,
    size: page.size ?? 20,
    totalElements: page.totalElements ?? content.length,
    totalPages: page.totalPages ?? (content.length > 0 ? 1 : 0),
    hasNext: page.hasNext ?? false,
  };
}

export function getOccupancyRate(totalSeats: number, availableSeats: number): number {
  if (totalSeats <= 0) {
    return 0;
  }

  return Math.round(((totalSeats - availableSeats) / totalSeats) * 100);
}

export function getDefaultDateTimeLocal(addMinutes = 0): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() + addMinutes);
  date.setSeconds(0, 0);

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
