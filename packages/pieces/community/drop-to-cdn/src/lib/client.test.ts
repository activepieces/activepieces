import {
  HttpMethod,
  HttpRequest,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dropToCdnApiCall } from './client';

function resp(body: unknown, status = 200): HttpResponse {
  return { status, headers: {}, body };
}

let sendRequest: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  sendRequest = vi.spyOn(httpClient, 'sendRequest');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('dropToCdnApiCall', () => {
  it('sends Bearer auth and returns the response body on success', async () => {
    sendRequest.mockResolvedValue(
      resp({
        id: 'abc123',
        url: 'https://cdn.example.com/abc123',
      })
    );

    const body = await dropToCdnApiCall({
      apiKey: 'dtc_test_key',
      method: HttpMethod.GET,
      resourceUri: '/files/abc123',
    });

    expect(body).toEqual({
      id: 'abc123',
      url: 'https://cdn.example.com/abc123',
    });

    const req = sendRequest.mock.calls[0][0] as HttpRequest;
    expect(req.method).toBe(HttpMethod.GET);
    expect(req.url).toBe('https://api.droptocdn.com/v1/files/abc123');
    expect(req.headers?.Authorization).toBe('Bearer dtc_test_key');
  });

  it('throws a readable error when the API returns 404', async () => {
    sendRequest.mockResolvedValue(resp({ error: 'File not found' }, 404));

    await expect(
      dropToCdnApiCall({
        apiKey: 'dtc_test_key',
        method: HttpMethod.GET,
        resourceUri: '/files/missing',
      })
    ).rejects.toThrow('File not found');
  });
});
