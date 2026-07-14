import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from './client';

describe('ApiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('adds bearer token and parses successful JSON responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json;charset=UTF-8' }),
      json: async () => ({ id: 'me' }),
    });
    const client = new ApiClient({
      baseUrl: 'http://localhost:8080/api',
      getAccessToken: () => 'token-123',
      fetcher: fetchMock,
    });

    const response = await client.get('/users/me');

    expect(response).toEqual({ id: 'me' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/users/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      }),
    );
  });

  it('prefixes API paths when the base URL is the origin', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ accessToken: 'token' }),
    });
    const client = new ApiClient({ baseUrl: 'http://localhost:8080', fetcher: fetchMock });

    await client.post('/auth/login', {});

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/auth/login', expect.any(Object));
  });

  it('checks email availability through the auth API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ email: 'student@univ.com', available: true }),
    });
    const client = new ApiClient({ baseUrl: '/api', fetcher: fetchMock });

    await expect(client.checkEmail('student@univ.com')).resolves.toEqual({
      email: 'student@univ.com',
      available: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/email/check',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'student@univ.com' }),
      }),
    );
  });

  it('uploads profile images as multipart form data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ profileImageUrl: '/uploads/profiles/me/profile.jpg' }),
    });
    const client = new ApiClient({ baseUrl: '/api', fetcher: fetchMock });
    const file = new File(['profile'], 'profile.jpg', { type: 'image/jpeg' });

    await client.uploadProfileImage(file);

    const [, init] = fetchMock.mock.calls[0];
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/users/me/profile-image',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      }),
    );
    expect((init?.body as FormData).get('file')).toBe(file);
    expect(init?.headers).not.toHaveProperty('Content-Type');
  });

  it('requests current week stats with from and to dates', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 21, 12));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        period: 'WEEKLY',
        from: '2026-05-18',
        to: '2026-05-24',
        totalMinutes: 0,
        comparedToPreviousMinutes: 0,
        daily: [],
        topSpaces: [],
      }),
    });
    const client = new ApiClient({ baseUrl: '/api', fetcher: fetchMock });

    await client.getStats();

    expect(fetchMock).toHaveBeenCalledWith('/api/stats/me?from=2026-05-18&to=2026-05-24', expect.any(Object));
  });

  it('requests stats with an explicit date range', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        period: 'CUSTOM',
        from: '2026-05-01',
        to: '2026-05-03',
        totalMinutes: 0,
        comparedToPreviousMinutes: 0,
        daily: [],
        topSpaces: [],
      }),
    });
    const client = new ApiClient({ baseUrl: '/api', fetcher: fetchMock });

    await client.getStats({ from: '2026-05-01', to: '2026-05-03' });

    expect(fetchMock).toHaveBeenCalledWith('/api/stats/me?from=2026-05-01&to=2026-05-03', expect.any(Object));
  });

  it('encodes the selected KST seat snapshot time', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ spaceId: 'space-1', rows: 0, columns: 0, seats: [] }),
    });
    const client = new ApiClient({ baseUrl: '/api', fetcher: fetchMock });

    await client.getSeats('space-1', '2026-07-20T09:00:00+09:00');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/spaces/space-1/seats?at=2026-07-20T09%3A00%3A00%2B09%3A00',
      expect.any(Object),
    );
  });

  it('returns undefined for no-content responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
      text: async () => '',
    });
    const client = new ApiClient({ baseUrl: '/api', fetcher: fetchMock });

    await expect(client.delete('/spaces/space-1/favorite')).resolves.toBeUndefined();
  });

  it('throws ApiError with backend code and message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ code: 'RSV-004', message: '이미 해당 시간대에 예약된 좌석입니다.' }),
    });
    const client = new ApiClient({ baseUrl: '/api', fetcher: fetchMock });

    await expect(client.post('/reservations', {})).rejects.toMatchObject({
      status: 409,
      code: 'RSV-004',
      message: '이미 해당 시간대에 예약된 좌석입니다.',
    });
  });

  it('passes optional cancel reason as a query parameter', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
      text: async () => '',
    });
    const client = new ApiClient({ baseUrl: '/api', fetcher: fetchMock });

    await client.cancelReservation('rsv-1', '일정 변경');

    expect(fetchMock).toHaveBeenCalledWith('/api/reservations/rsv-1?reason=%EC%9D%BC%EC%A0%95+%EB%B3%80%EA%B2%BD', expect.any(Object));
  });
});
