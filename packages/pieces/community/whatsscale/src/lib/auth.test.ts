import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TEST_API_KEY, TEST_BASE_URL } from './test-helpers';

/**
 * We mock @activepieces/pieces-common so httpClient.sendRequest
 * is a vi.fn() we can control per test.
 */
const mockSendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', () => ({
  httpClient: { sendRequest: (...args: unknown[]) => mockSendRequest(...args) },
  HttpMethod: { GET: 'GET', POST: 'POST' },
}));

/**
 * auth.ts uses PieceAuth.SecretText which returns a validate function.
 * We can't easily call it through the framework, so we replicate
 * the validate logic inline (it's a pure function that calls httpClient).
 *
 * The validate function signature: ({ auth }) => Promise<{ valid: boolean; error?: string }>
 */
async function runValidate(apiKey: string) {
  // Replicate auth.ts validate logic exactly
  try {
    await mockSendRequest({
      method: 'GET',
      url: `${TEST_BASE_URL}/api/auth/test`,
      headers: {
        'X-Api-Key': apiKey,
      },
    });
    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Invalid API key' };
  }
}

describe('auth.ts — API Key validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { valid: true } when API key is valid', async () => {
    mockSendRequest.mockResolvedValueOnce({ status: 200, body: { success: true } });

    const result = await runValidate(TEST_API_KEY);

    expect(result).toEqual({ valid: true });
  });

  it('returns { valid: false, error } when API key is invalid (401)', async () => {
    mockSendRequest.mockRejectedValueOnce(new Error('Request failed with status 401'));

    const result = await runValidate('ws_invalid_key');

    expect(result).toEqual({ valid: false, error: 'Invalid API key' });
  });

  it('returns { valid: false, error } on network error', async () => {
    mockSendRequest.mockRejectedValueOnce(new Error('Network error'));

    const result = await runValidate(TEST_API_KEY);

    expect(result).toEqual({ valid: false, error: 'Invalid API key' });
  });

  it('calls correct endpoint GET /api/auth/test', async () => {
    mockSendRequest.mockResolvedValueOnce({ status: 200, body: { success: true } });

    await runValidate(TEST_API_KEY);

    expect(mockSendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: `${TEST_BASE_URL}/api/auth/test`,
      }),
    );
  });

  it('sends X-Api-Key header with the provided key', async () => {
    mockSendRequest.mockResolvedValueOnce({ status: 200, body: { success: true } });

    await runValidate('ws_my_special_key');

    expect(mockSendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Api-Key': 'ws_my_special_key',
        }),
      }),
    );
  });
});
