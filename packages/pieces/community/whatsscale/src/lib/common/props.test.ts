import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TEST_API_KEY, createMockHttpResponse } from '../test-helpers';

const mockSendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', () => ({
  httpClient: { sendRequest: (...args: unknown[]) => mockSendRequest(...args) },
  HttpMethod: { GET: 'GET', POST: 'POST' },
}));

/**
 * props.ts uses Property.Dropdown which wraps an options() async function.
 * We test the options logic directly by extracting it.
 *
 * The actual signature in props.ts:
 *   options: async ({ auth }) => { ... }
 *   where auth is the PieceAuth context — auth.secret_text is the raw key.
 *
 * It calls: whatsscaleClient(auth.secret_text, HttpMethod.GET, '/make/sessions')
 * which calls: httpClient.sendRequest({ method, url, headers, ... })
 */

// Import after mocks
import { whatsscaleClient } from './client';

/**
 * Replicate the session dropdown options logic from props.ts
 * so we can test it in isolation.
 */
async function getSessionOptions(auth: { secret_text: string } | undefined) {
  if (!auth) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Please connect your account',
    };
  }
  try {
    const response = await whatsscaleClient(auth.secret_text, 'GET' as any, '/make/sessions');
    const sessions = response.body as { label: string; value: string }[];
    if (!sessions || sessions.length === 0) {
      return {
        disabled: true,
        options: [],
        placeholder: 'No sessions found. Connect WhatsApp at whatsscale.com',
      };
    }
    return {
      disabled: false,
      options: sessions,
    };
  } catch (e) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Error loading sessions',
    };
  }
}

describe('props.ts — session dropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /make/sessions with correct auth', async () => {
    const sessions = [
      { label: 'My Session', value: 'user_abc123' },
    ];
    mockSendRequest.mockResolvedValueOnce(createMockHttpResponse(sessions));

    await getSessionOptions({ secret_text: TEST_API_KEY });

    expect(mockSendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'https://proxy.whatsscale.com/make/sessions',
        headers: expect.objectContaining({
          'X-Api-Key': TEST_API_KEY,
        }),
      }),
    );
  });

  it('returns options directly from response', async () => {
    const sessions = [
      { label: 'Session 1', value: 'user_111' },
      { label: 'Session 2', value: 'user_222' },
    ];
    mockSendRequest.mockResolvedValueOnce(createMockHttpResponse(sessions));

    const result = await getSessionOptions({ secret_text: TEST_API_KEY });

    expect(result).toEqual({
      disabled: false,
      options: sessions,
    });
  });

  it('returns disabled state when response is empty array', async () => {
    mockSendRequest.mockResolvedValueOnce(createMockHttpResponse([]));

    const result = await getSessionOptions({ secret_text: TEST_API_KEY });

    expect(result).toEqual({
      disabled: true,
      options: [],
      placeholder: 'No sessions found. Connect WhatsApp at whatsscale.com',
    });
  });

  it('returns disabled state on network error', async () => {
    mockSendRequest.mockRejectedValueOnce(new Error('Network error'));

    const result = await getSessionOptions({ secret_text: TEST_API_KEY });

    expect(result).toEqual({
      disabled: true,
      options: [],
      placeholder: 'Error loading sessions',
    });
  });
});
