import type {
  Affiliation,
  CongestionPredictionResponse,
  CreateReservationRequest,
  CreateReservationResponse,
  ExtendReservationResponse,
  LoginResponse,
  NoticeCategory,
  NoticeDetailResponse,
  NoticeListItemResponse,
  PageResponse,
  ReservationFilter,
  ReservationSummary,
  SeatLayoutResponse,
  SignupRequest,
  SpaceCategory,
  SpaceDetailResponse,
  SpaceListItemResponse,
  StatResponse,
  UserResponse,
} from './types';

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const API_PATH_PREFIX = '/api';

interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
  fetcher?: Fetcher;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  traceId?: string;

  constructor(message: string, status: number, code?: string, traceId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.traceId = traceId;
  }
}

export class ApiClient {
  private baseUrl: string;
  private getAccessToken?: () => string | null;
  private onUnauthorized?: () => void;
  private fetcher: Fetcher;

  constructor(options: ApiClientOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.getAccessToken = options.getAccessToken;
    this.onUnauthorized = options.onUnauthorized;
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  }

  setAccessTokenGetter(getAccessToken: () => string | null): void {
    this.getAccessToken = getAccessToken;
  }

  setUnauthorizedHandler(onUnauthorized: () => void): void {
    this.onUnauthorized = onUnauthorized;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body });
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body });
  }

  delete<T = void>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  login(email: string, password: string): Promise<LoginResponse> {
    return this.post('/auth/login', { email, password });
  }

  signup(request: SignupRequest): Promise<{ userId: string; email: string; name: string; createdAt: string }> {
    return this.post('/auth/signup', request);
  }

  logout(): Promise<void> {
    return this.post('/auth/logout');
  }

  getMe(): Promise<UserResponse> {
    return this.get('/users/me');
  }

  updateMe(request: { name?: string; phone?: string; affiliation?: Affiliation | '' }): Promise<UserResponse> {
    const body = {
      ...request,
      affiliation: request.affiliation || undefined,
    };

    return this.patch('/users/me', body);
  }

  getSpaces(params: {
    category?: SpaceCategory | '';
    keyword?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<SpaceListItemResponse>> {
    return this.get(`/spaces${queryString(params)}`);
  }

  getSpace(id: string): Promise<SpaceDetailResponse> {
    return this.get(`/spaces/${id}`);
  }

  getCongestion(id: string, date?: string): Promise<CongestionPredictionResponse> {
    return this.get(`/spaces/${id}/congestion${queryString({ date })}`);
  }

  addFavorite(id: string): Promise<void> {
    return this.post(`/spaces/${id}/favorite`);
  }

  removeFavorite(id: string): Promise<void> {
    return this.delete(`/spaces/${id}/favorite`);
  }

  getSeats(spaceId: string, at?: string): Promise<SeatLayoutResponse> {
    return this.get(`/spaces/${spaceId}/seats${queryString({ at })}`);
  }

  createReservation(request: CreateReservationRequest): Promise<CreateReservationResponse> {
    return this.post('/reservations', request);
  }

  getMyReservations(params: {
    status?: ReservationFilter;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ReservationSummary>> {
    return this.get(`/reservations/me${queryString(params)}`);
  }

  extendReservation(id: string, additionalMinutes: number): Promise<ExtendReservationResponse> {
    return this.patch(`/reservations/${id}/extend`, { additionalMinutes });
  }

  cancelReservation(id: string, reason?: string): Promise<void> {
    return this.delete(`/reservations/${id}${queryString({ reason })}`);
  }

  getStats(period: 'WEEKLY' | 'MONTHLY' | 'YEARLY' = 'WEEKLY'): Promise<StatResponse> {
    return this.get(`/stats/me${queryString({ period })}`);
  }

  getNotices(params: {
    category?: NoticeCategory;
    page?: number;
    size?: number;
  }): Promise<PageResponse<NoticeListItemResponse>> {
    const category = params.category === 'ALL' ? undefined : params.category;
    return this.get(`/notices${queryString({ ...params, category })}`);
  }

  getNotice(id: string): Promise<NoticeDetailResponse> {
    return this.get(`/notices/${id}`);
  }

  private async request<T>(
    path: string,
    options: { method?: string; body?: unknown } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {};
    const token = this.getAccessToken?.();
    const isFormData = options.body instanceof FormData;

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (options.body !== undefined && !isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const requestBody: BodyInit | undefined = isFormData
      ? options.body as FormData
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined;

    const response = await this.fetcher(`${this.baseUrl}${apiPath(path)}`, {
      method: options.method ?? 'GET',
      headers,
      body: requestBody,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.onUnauthorized?.();
      }

      throw await this.toApiError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return response.text() as Promise<T>;
  }

  private async toApiError(response: Response): Promise<ApiError> {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const body = (await response.json()) as { code?: string; message?: string; traceId?: string };
      return new ApiError(body.message ?? '요청을 처리하지 못했습니다.', response.status, body.code, body.traceId);
    }

    const message = await response.text();
    return new ApiError(message || '요청을 처리하지 못했습니다.', response.status);
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '');
  return trimmed.endsWith(API_PATH_PREFIX) ? trimmed.slice(0, -API_PATH_PREFIX.length) : trimmed;
}

function apiPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedPath.startsWith(`${API_PATH_PREFIX}/`) ? normalizedPath : `${API_PATH_PREFIX}${normalizedPath}`;
}

function queryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const text = query.toString();
  return text ? `?${text}` : '';
}
