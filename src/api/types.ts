export type SpaceCategory = 'READING_ROOM' | 'STUDY_ROOM' | 'PC_ROOM' | 'LECTURE_ROOM';
export type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'UNAVAILABLE' | 'RESERVED';
export type ReservationStatus = 'SCHEDULED' | 'IN_USE' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';
export type ReservationFilter = 'ACTIVE' | 'PAST' | 'CANCELED';
export type CongestionLevel = 'LOW' | 'NORMAL' | 'HIGH';
export type Affiliation = 'UNDERGRADUATE' | 'GRADUATE' | 'FACULTY' | 'ASSISTANT' | 'EXTERNAL';
export type NoticeCategory = 'ALL' | 'INFO' | 'MAINTENANCE' | 'EVENT';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  affiliation?: Affiliation;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  affiliation: Affiliation | null;
  profileImageUrl: string | null;
  role: string;
  createdAt: string;
}

export interface SpaceListItemResponse {
  id: string;
  name: string;
  floor: number;
  category: SpaceCategory;
  totalSeats: number;
  availableSeats: number;
  congestion: CongestionLevel;
  openTime: string;
  closeTime: string;
  features: string[];
  thumbnailUrl: string | null;
}

export interface SpaceDetailResponse extends Omit<SpaceListItemResponse, 'thumbnailUrl'> {
  rows: number;
  columns: number;
  maxReservationHours: number;
  images: string[];
  isFavorite: boolean;
}

export interface SeatItemResponse {
  id: string;
  label: string;
  row: number;
  column: number;
  status: SeatStatus;
  features: string[];
}

export interface SeatLayoutResponse {
  spaceId: string;
  rows: number;
  columns: number;
  seats: SeatItemResponse[];
}

export interface CongestionPredictionResponse {
  spaceId: string;
  date: string;
  hourly: Array<{
    hour: number;
    occupancyRate: number;
    level: CongestionLevel;
  }>;
}

export interface CreateReservationRequest {
  seatId: string;
  startAt: string;
  endAt: string;
}

export interface ReservationSummary {
  id: string;
  seatLabel: string;
  spaceName: string;
  spaceFloor: number;
  startAt: string;
  endAt: string;
  status: ReservationStatus;
  remainingSeconds: number | null;
}

export interface ReservationDetailResponse extends ReservationSummary {
  seatId: string;
  spaceId: string;
  durationHours: number;
  extendedCount: number;
  createdAt: string;
}

export interface CreateReservationResponse extends ReservationDetailResponse {
  status: 'SCHEDULED';
}

export interface ExtendReservationResponse {
  id: string;
  endAt: string;
  extendedCount: number;
}

export interface StatResponse {
  period: string;
  from: string;
  to: string;
  totalMinutes: number;
  comparedToPreviousMinutes: number;
  daily: Array<{ date: string; minutes: number }>;
  topSpaces: Array<{ spaceId: string; spaceName: string; minutes: number }>;
}

export interface NoticeListItemResponse {
  id: string;
  title: string;
  category: Exclude<NoticeCategory, 'ALL'>;
  publishedAt: string;
  isNew: boolean;
}

export interface NoticeDetailResponse extends NoticeListItemResponse {
  content: string;
}
