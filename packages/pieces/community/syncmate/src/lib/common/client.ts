import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

/** SyncMate's Cloudflare gateway. Paths have no /api prefix. */
export const DEFAULT_BASE_URL = 'https://api.assistro.co';

/**
 * Sent on every call. The gateway and Assistro check the plan against this
 * integration; without it they would check the `custom` API add-on instead.
 */
export const INTEGRATION = 'activepieces';

/** The gateway refuses bodies over 5 MB (assistro-cloudflare-gateway MAX_BODY_BYTES). */
export const GATEWAY_MAX_BODY_BYTES = 5 * 1024 * 1024;

export type SyncmateCredentials = { apiKey: string; baseUrl: string };

/**
 * The connection's values. Actions receive `{ type, props }`; the auth
 * `validate` hook receives the props object itself.
 */
export function credentials(auth: unknown): SyncmateCredentials {
  const holder = (auth ?? {}) as Record<string, unknown>;
  const props = (
    holder['props'] && typeof holder['props'] === 'object' ? holder['props'] : holder
  ) as Record<string, unknown>;
  const apiKey = String(props['apiKey'] ?? '').trim();
  if (!apiKey) {
    throw new Error('The SyncMate connection has no API key.');
  }
  return { apiKey, baseUrl: normalizeBaseUrl(props['baseUrl']) };
}

export function normalizeBaseUrl(value: unknown): string {
  const url = String(value ?? '').trim().replace(/\/+$/, '');
  return url === '' ? DEFAULT_BASE_URL : url;
}

export function headersFor(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    Integration: INTEGRATION,
    Accept: 'application/json',
  };
}

export async function syncmateRequest<T = unknown>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: unknown;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: QueryParams;
}): Promise<T> {
  const { apiKey, baseUrl } = credentials(auth);

  if (body !== undefined) {
    assertWithinGatewayLimit(body);
  }

  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${baseUrl}${path}`,
      headers: headersFor(apiKey),
      body,
      queryParams,
    });
    return response.body;
  } catch (e) {
    throw new Error(describeError(e));
  }
}

export function assertWithinGatewayLimit(body: unknown): void {
  const bytes = Buffer.byteLength(JSON.stringify(body), 'utf8');
  if (bytes > GATEWAY_MAX_BODY_BYTES) {
    const mb = (bytes / 1024 / 1024).toFixed(1);
    throw new Error(
      `The message is ${mb} MB, over the 5 MB SyncMate limit. Attachments are sent as base64, which adds about a third: keep files under about 3.5 MB in total.`
    );
  }
}

type ErrorBody = { message?: unknown; error?: unknown; reason?: unknown; resets_at?: unknown; errors?: unknown };

/** A message a flow builder can act on, from an HttpError or any other error. */
export function describeError(e: unknown): string {
  const response = (e as { response?: { status?: unknown; body?: unknown } } | null)?.response;
  const status = typeof response?.status === 'number' ? response.status : undefined;

  if (status === undefined) {
    return e instanceof Error ? e.message : String(e);
  }

  const raw = response?.body;
  const body: ErrorBody =
    raw && typeof raw === 'object'
      ? (raw as ErrorBody)
      : typeof raw === 'string'
        ? safeJson(raw)
        : {};
  // Assistro answers with `message`, but some older endpoints (e.g. /groups) use `error`.
  const text = [body.message, body.error].find((v) => typeof v === 'string' && v.trim() !== '') as string | undefined;
  const message = text?.trim().replace(/\.+$/, '');
  const reason = typeof body.reason === 'string' ? body.reason : undefined;

  switch (status) {
    case 401:
      return reason === 'token_expired'
        ? 'Your SyncMate API key has expired. Generate a new one on the SyncMate Configuration page and update this connection.'
        : 'SyncMate rejected the API key: it is invalid or was revoked. Check the key on the SyncMate Configuration page.';
    case 402:
    case 403:
      return `SyncMate refused the request: ${message ?? 'not allowed on your plan'}. Check that your plan and the Activepieces add-on are active.`;
    case 404:
      return `Not found: ${message ?? 'SyncMate has no such resource for this account'}.`;
    case 413:
      return 'The message is too large for SyncMate (5 MB limit). Send smaller attachments.';
    case 422:
      return `SyncMate could not accept the request: ${message ?? firstValidationError(body.errors) ?? 'invalid input'}.`;
    case 429: {
      const resets = typeof body.resets_at === 'string' ? ` Resets at ${body.resets_at}.` : '';
      // Like the Zapier app's ThrottledError: the per-minute send limit clears itself, so a retry works.
      const retry = /rate limit|try again/i.test(message ?? '')
        ? ' Turn on "Retry on Failure" for this step to retry automatically.'
        : '';
      return `${message ?? 'Too many requests or message limit reached'}.${resets}${retry}`;
    }
    default:
      return `SyncMate request failed (HTTP ${status})${message ? `: ${message}` : ''}.`;
  }
}

function safeJson(text: string): ErrorBody {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? (parsed as ErrorBody) : {};
  } catch {
    return {};
  }
}

function firstValidationError(errors: unknown): string | undefined {
  if (!errors || typeof errors !== 'object') return undefined;
  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  }
  return undefined;
}
