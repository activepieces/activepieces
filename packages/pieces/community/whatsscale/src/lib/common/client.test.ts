import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TEST_API_KEY, TEST_BASE_URL, createMockHttpResponse } from '../test-helpers';

const mockSendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', () => ({
  httpClient: { sendRequest: (...args: unknown[]) => mockSendRequest(...args) },
  HttpMethod: { GET: 'GET', POST: 'POST' },
}));

// Import after mock is set up
import { whatsscaleClient, BASE_URL } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

describe('client.ts — whatsscaleClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds correct full URL from BASE_URL + path', async () => {
    mockSendRequest.mockResolvedValueOnce(createMockHttpResponse({ ok: true }));

    await whatsscaleClient(TEST_API_KEY, HttpMethod.GET, '/make/sessions');

    expect(mockSendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `${TEST_BASE_URL}/make/sessions`,
      }),
    );
  });

  it('sets X-Api-Key header from auth param', async () => {
    mockSendRequest.mockResolvedValueOnce(createMockHttpResponse({ ok: true }));

    await whatsscaleClient('ws_custom_key_456', HttpMethod.GET, '/make/sessions');

    expect(mockSendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Api-Key': 'ws_custom_key_456',
        }),
      }),
    );
  });

  it('sets Content-Type: application/json header', async () => {
    mockSendRequest.mockResolvedValueOnce(createMockHttpResponse({ ok: true }));

    await whatsscaleClient(TEST_API_KEY, HttpMethod.GET, '/make/sessions');

    expect(mockSendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('passes body for POST requests', async () => {
    mockSendRequest.mockResolvedValueOnce(createMockHttpResponse({ ok: true }));

    const body = { session: 'user_123', chatId: '31612345678@c.us', text: 'Hello' };
    await whatsscaleClient(TEST_API_KEY, HttpMethod.POST, '/api/sendText', body);

    expect(mockSendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        body,
      }),
    );
  });

  it('passes query params for GET requests', async () => {
    mockSendRequest.mockResolvedValueOnce(createMockHttpResponse([]));

    const queryParams = { session: 'user_123' };
    await whatsscaleClient(TEST_API_KEY, HttpMethod.GET, '/make/contacts', undefined, queryParams);

    expect(mockSendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        queryParams: { session: 'user_123' },
      }),
    );
  });

  it('propagates errors (does not catch)', async () => {
    const error = new Error('Request failed with status 500');
    mockSendRequest.mockRejectedValueOnce(error);

    await expect(
      whatsscaleClient(TEST_API_KEY, HttpMethod.POST, '/api/sendText', { text: 'test' }),
    ).rejects.toThrow('Request failed with status 500');
  });

  it('exports BASE_URL as https://proxy.whatsscale.com', () => {
    expect(BASE_URL).toBe('https://proxy.whatsscale.com');
  });
});
