import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

export const LINKUPAPI_BASE_URL = 'https://api.linkupapi.com/v2';

// ─── Authentication ──────────────────────────────────────────────────────────

export const linkupAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your LinkupAPI key, sent as the `x-api-key` header. Get it from https://app.linkupapi.com',
  validate: async ({ auth }) => {
    try {
      // GET /accounts is free (0 credits) — ideal for validating the key.
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${LINKUPAPI_BASE_URL}/accounts`,
        headers: { 'x-api-key': auth},
        queryParams: { limit: '1' },
      });
      return { valid: true };
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error: 'Invalid API key. Check it at https://app.linkupapi.com',
        };
      }
      return {
        valid: false,
        error: `Could not reach LinkupAPI to validate the key (status ${
          status ?? 'network error'
        }). Please try again.`,
      };
    }
  },
});

// ─── Shared props ────────────────────────────────────────────────────────────

export const accountIdProp = Property.ShortText({
  displayName: 'Account ID',
  description:
    'The connected LinkedIn account to act as. Get it from the "List Accounts" action.',
  required: true,
});

// ─── Request helpers ─────────────────────────────────────────────────────────

/**
 * V2 action-based endpoint: POST /v2/<category> with body { account_id, action, params }.
 * `params` is cleaned of empty/undefined values before sending.
 */
export async function linkupAction<T = unknown>(
  apiKey: string,
  category: string,
  action: string,
  accountId: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${LINKUPAPI_BASE_URL}/${category}`,
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: { account_id: accountId, action, params: cleanParams(params) },
  });
  return response.body;
}

/** Raw POST to a V2 path (used for endpoints that don't follow the action/params shape, e.g. /webhooks). */
export async function linkupPost<T = unknown>(
  apiKey: string,
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${LINKUPAPI_BASE_URL}${path}`,
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body,
  });
  return response.body;
}

export async function linkupGet<T = unknown>(
  apiKey: string,
  path: string,
  queryParams: QueryParams = {}
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${LINKUPAPI_BASE_URL}${path}`,
    headers: { 'x-api-key': apiKey },
    queryParams,
  });
  return response.body;
}

export async function linkupDelete<T = unknown>(
  apiKey: string,
  path: string
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.DELETE,
    url: `${LINKUPAPI_BASE_URL}${path}`,
    headers: { 'x-api-key': apiKey },
  });
  return response.body;
}

/** Drop null / undefined / empty-string values so optional props aren't sent. */
export function cleanParams(
  params: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      out[k] = v;
    }
  }
  return out;
}
