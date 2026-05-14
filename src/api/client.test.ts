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
});
