/**
 * Shared test helpers for WhatsScale piece tests.
 *
 * Provides mock factories that match the actual Activepieces
 * context shapes used by auth.ts, props.ts, and action run() methods.
 */

/** Standard test API key */
export const TEST_API_KEY = 'ws_test_api_key_123';

/** Standard base URL (must match client.ts) */
export const TEST_BASE_URL = 'https://proxy.whatsscale.com';

/**
 * Creates a mock HTTP response matching HttpResponse shape
 * from @activepieces/pieces-common.
 */
export function createMockHttpResponse(
  body: unknown,
  status = 200,
): { status: number; body: unknown; headers: Record<string, string> } {
  return {
    status,
    body,
    headers: {},
  };
}
