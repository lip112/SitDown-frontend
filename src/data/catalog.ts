import type { Affiliation, NoticeCategory, ReservationFilter, SpaceCategory } from '../api/types';

export const spaceCategories: Array<{ value: SpaceCategory | ''; label: string; hint: string }> = [
  { value: '', label: '전체', hint: '모든 공간' },
  { value: 'READING_ROOM', label: '열람실', hint: '조용한 개인 학습' },
  { value: 'STUDY_ROOM', label: '스터디룸', hint: '모임과 토론' },
  { value: 'PC_ROOM', label: 'PC실', hint: '장비 이용' },
  { value: 'LECTURE_ROOM', label: '강의실', hint: '개방 강의실' },
];

export const affiliations: Array<{ value: Affiliation | ''; label: string }> = [
  { value: '', label: '선택 안 함' },
  { value: 'UNDERGRADUATE', label: '학부생' },
  { value: 'GRADUATE', label: '대학원생' },
  { value: 'FACULTY', label: '교직원' },
  { value: 'ASSISTANT', label: '조교' },
  { value: 'EXTERNAL', label: '외부인' },
];

export const reservationFilters: Array<{ value: ReservationFilter; label: string }> = [
  { value: 'ACTIVE', label: '진행 중' },
  { value: 'PAST', label: '지난 예약' },
  { value: 'CANCELED', label: '취소됨' },
];

export const noticeCategories: Array<{ value: NoticeCategory; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'INFO', label: '안내' },
  { value: 'MAINTENANCE', label: '점검' },
  { value: 'EVENT', label: '이벤트' },
];

const fallbackImages = [
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
];

export function spaceImage(url: string | null | undefined, index = 0): string {
  return url || fallbackImages[index % fallbackImages.length];
}
