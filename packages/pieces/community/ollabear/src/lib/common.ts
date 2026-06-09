import { createHmac, timingSafeEqual } from 'crypto';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpHeaders } from '@activepieces/pieces-common';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
//
// Ollabear's server-to-server surface (/v1/integrations) is authed by a
// scoped Personal Access Token (Bearer pat_…), NOT the public qk_ widget
// key — the widget key is origin-locked and meant for the browser.
//
// Mint a PAT in the dashboard: Settings → API tokens → New token, with the
// scopes the flow needs (conversations_read/write, messages_write,
// webhooks_write — triggers need webhooks_write to self-register).

export const ollabearAuth = PieceAuth.CustomAuth({
  description:
    'Connect using a Personal Access Token (pat_…) minted in the Ollabear dashboard under Settings → API tokens. ' +
    'Grant the scopes your flow needs: messages_write (send), conversations_read/write (read/tag/close), ' +
    'webhooks_write (required for triggers to self-register).',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Ollabear Base URL',
      description: 'Your Ollabear API base URL.',
      required: true,
      defaultValue: 'https://app.ollabear.com',
    }),
    token: PieceAuth.SecretText({
      displayName: 'Personal Access Token',
      description: 'The pat_… token. Stored encrypted; shown only once at mint time.',
      required: true,
    }),
  },
});

export interface OllabearAuth {
  baseUrl: string;
  token: string;
}

// coerceAuth normalises whatever Activepieces hands us in `context.auth`.
// At runtime a CustomAuth value is the unwrapped props object
// ({ baseUrl, token }); some framework versions *type* it as the wrapped
// connection shape ({ type, props }). Reading `props ?? self` through
// `unknown` handles both without fighting version-specific types.
export function coerceAuth(raw: unknown): OllabearAuth {
  const v = (raw ?? {}) as {
    baseUrl?: string;
    token?: string;
    props?: { baseUrl?: string; token?: string };
  };
  const p = v.props ?? v;
  return { baseUrl: String(p.baseUrl ?? ''), token: String(p.token ?? '') };
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

function trimSlash(u: string): string {
  return u.replace(/\/+$/, '');
}

export async function ollabearRequest<T = unknown>(
  auth: OllabearAuth,
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: HttpHeaders = {
    Authorization: `Bearer ${auth.token}`,
    'Content-Type': 'application/json',
  };
  const res = await httpClient.sendRequest<T>({
    method,
    url: `${trimSlash(auth.baseUrl)}/v1/integrations${path}`,
    headers,
    body: body as Record<string, unknown> | undefined,
  });
  return res.body;
}

// ---------------------------------------------------------------------------
// Webhook subscription lifecycle (shared by every trigger)
// ---------------------------------------------------------------------------

const WEBHOOK_STORE_KEY = '_ollabear_webhook_id';
const WEBHOOK_SECRET_KEY = '_ollabear_webhook_secret';

type CreatedWebhook = { id: string; secret?: string };

type Store = {
  put: (k: string, v: unknown) => Promise<unknown>;
  get: (k: string) => Promise<unknown>;
};

export async function registerWebhook(
  auth: OllabearAuth,
  store: Store,
  webhookUrl: string,
  events: string[],
): Promise<void> {
  const created = await ollabearRequest<CreatedWebhook>(auth, HttpMethod.POST, '/webhooks', {
    url: webhookUrl,
    events,
    description: `Activepieces trigger (${events.join(', ')})`,
  });
  await store.put(WEBHOOK_STORE_KEY, created.id);
  // The HMAC signing secret is returned ONCE at creation — stash it so run()
  // can verify the X-Webhook-Signature header on each delivery.
  if (created.secret) {
    await store.put(WEBHOOK_SECRET_KEY, created.secret);
  }
}

export async function getStoredSecret(store: { get: (k: string) => Promise<unknown> }): Promise<string | undefined> {
  const s = await store.get(WEBHOOK_SECRET_KEY);
  return typeof s === 'string' && s.length > 0 ? s : undefined;
}

// verifyDelivery checks Ollabear's X-Webhook-Signature header against the raw
// request body: hex(HMAC-SHA256(rawBody, secret)). Returns true = accept.
//   - No stored secret (older subscription) → accept (can't verify, don't drop).
//   - Secret present but rawBody unavailable → accept (some AP runtimes don't
//     surface rawBody; re-serialising risks byte mismatch, so we don't block).
//   - Secret + rawBody present → strict constant-time compare; mismatch = drop.
export function verifyDelivery(
  payload: { rawBody?: unknown; headers?: Record<string, string> },
  secret: string | undefined,
): boolean {
  if (!secret) return true;
  const raw = payload.rawBody;
  const rawStr =
    typeof raw === 'string' ? raw : Buffer.isBuffer(raw) ? raw.toString('utf8') : undefined;
  if (rawStr === undefined) return true;

  const headers = payload.headers ?? {};
  const sig = headers['x-webhook-signature'] ?? headers['X-Webhook-Signature'];
  if (!sig) return false; // secret expected, signature missing → reject

  const expected = createHmac('sha256', secret).update(rawStr).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function unregisterWebhook(
  auth: OllabearAuth,
  store: { get: (k: string) => Promise<unknown> },
): Promise<void> {
  const id = (await store.get(WEBHOOK_STORE_KEY)) as string | undefined;
  if (!id) return;
  // Best-effort: a 404 (already gone) must not block flow teardown.
  try {
    await ollabearRequest(auth, HttpMethod.DELETE, `/webhooks/${id}`);
  } catch {
    /* swallow — the subscription is gone either way */
  }
}
