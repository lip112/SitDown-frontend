import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from './client';

describe('ApiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
