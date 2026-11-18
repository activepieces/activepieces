import type { AtpAgent } from '@atproto/api';
import { createHash } from 'crypto';
import { blueskyAtproto } from './atproto';
import type { BlueSkyAuthType } from './auth';

const DEFAULT_PDS_HOST = 'https://bsky.social';
const SESSION_TTL_MS = 50 * 60 * 1000;
const TOKEN_REFRESH_MARGIN_SECONDS = 60;

const agentCache = new Map<string, { agent: AtpAgent; expires: number }>();

function normalizePdsHost(raw: string | undefined | null): string {
  const trimmed = (raw ?? '').trim();
  if (trimmed === '') {
    return DEFAULT_PDS_HOST;
  }
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error(`PDS Host "${trimmed}" is not a valid URL. Use something like https://bsky.social.`);
  }
  if (parsed.username !== '' || parsed.password !== '') {
    throw new Error('PDS Host must not contain a username or password.');
  }
  return parsed.origin;
}

function cacheKeyFor(auth: BlueSkyAuthType): string {
  const passwordHash = createHash('sha256').update(auth.password).digest('hex');
  return `${normalizePdsHost(auth.pdsHost)}|${auth.identifier.trim().toLowerCase()}|${passwordHash}`;
}

async function createBlueskyAgent(auth: BlueSkyAuthType): Promise<AtpAgent> {
  const cacheKey = cacheKeyFor(auth);
  const cached = agentCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return cached.agent;
  }
  const service = normalizePdsHost(auth.pdsHost);
  const { AtpAgent } = await blueskyAtproto.load();
  const agent = new AtpAgent({ service });
  try {
    await agent.login({ identifier: auth.identifier.trim(), password: auth.password });
  } catch (error) {
    agentCache.delete(cacheKey);
    throw toBlueskyError({ error, action: 'sign in to Bluesky' });
  }
  agentCache.set(cacheKey, { agent, expires: Date.now() + SESSION_TTL_MS });
  return agent;
}

function clearAgentCache(): void {
  agentCache.clear();
}

function sessionDid(agent: AtpAgent): string {
  const did = agent.session?.did;
  if (!did) {
    throw new Error('The Bluesky session has no account DID. Reconnect the Bluesky connection.');
  }
  return did;
}

async function withBluesky<T>({
  auth,
  action,
  fn,
}: {
  auth: BlueSkyAuthType;
  action: string;
  fn: (agent: AtpAgent) => Promise<T>;
}): Promise<T> {
  const agent = await createBlueskyAgent(auth);
  try {
    return await fn(agent);
  } catch (error) {
    throw toBlueskyError({ error, action });
  }
}

class BlueskyApiError extends Error {
  readonly status: number;
  readonly xrpcError: string;
  constructor({ message, status, xrpcError }: { message: string; status: number; xrpcError: string }) {
    super(message);
    this.name = 'BlueskyApiError';
    this.status = status;
    this.xrpcError = xrpcError;
  }
}

function isXrpcError(value: unknown): value is XrpcLikeError {
  return (
    value instanceof Error &&
    'status' in value &&
    typeof value.status === 'number' &&
    'error' in value &&
    typeof value.error === 'string'
  );
}

function headerValue({ headers, name }: { headers: unknown; name: string }): string | undefined {
  if (typeof headers !== 'object' || headers === null || !(name in headers)) {
    return undefined;
  }
  const value: unknown = Reflect.get(headers, name);
  return typeof value === 'string' ? value : undefined;
}

function toBlueskyError({ error, action }: { error: unknown; action: string }): Error {
  if (error instanceof BlueskyApiError) {
    return error;
  }
  if (!isXrpcError(error)) {
    return error instanceof Error ? error : new Error(`Failed to ${action}: ${String(error)}`);
  }
  const vendorMessage = error.message && error.message !== error.error ? `${error.error}: ${error.message}` : error.error;
  let message: string;
  if (error.status === 429 || error.error === 'RateLimitExceeded') {
    const reset = headerValue({ headers: error.headers, name: 'ratelimit-reset' });
    const resetText = reset && /^\d+$/.test(reset) ? ` Limits reset at ${new Date(Number(reset) * 1000).toISOString()}.` : '';
    message = `Bluesky rate limit reached while trying to ${action}. Sign-ins are limited to 30 per 5 minutes and 300 per day per account.${resetText} (${vendorMessage})`;
  } else if (
    error.status === 401 ||
    error.error === 'AuthenticationRequired' ||
    error.error === 'ExpiredToken' ||
    error.error === 'InvalidToken'
  ) {
    message = `Bluesky rejected the credentials while trying to ${action}. Check the identifier and app password on the connection. (${vendorMessage})`;
  } else if (error.error === 'AccountTakedown' || error.error === 'AccountDeactivated') {
    message = `The Bluesky account cannot be used (${vendorMessage}).`;
  } else if (error.status === 404 || error.error === 'RecordNotFound' || error.error === 'NotFound') {
    message = `Bluesky could not find what was requested while trying to ${action}. (${vendorMessage})`;
  } else if (error.status === 400) {
    message = `Bluesky rejected the request to ${action}. (${vendorMessage})`;
  } else {
    message = `Failed to ${action}: Bluesky returned ${error.status}. (${vendorMessage})`;
  }
  return new BlueskyApiError({ message, status: error.status, xrpcError: error.error });
}

function jwtExpiry(token: string): number | undefined {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return undefined;
  }
  try {
    const payload: unknown = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (typeof payload === 'object' && payload !== null && 'exp' in payload && typeof payload.exp === 'number') {
      return payload.exp;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

async function freshAccessToken(auth: BlueSkyAuthType): Promise<string> {
  const agent = await createBlueskyAgent(auth);
  const current = agent.session?.accessJwt;
  const expiry = current ? jwtExpiry(current) : undefined;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (current && expiry !== undefined && expiry - TOKEN_REFRESH_MARGIN_SECONDS > nowSeconds) {
    return current;
  }
  try {
    await agent.sessionManager.refreshSession();
  } catch (error) {
    throw toBlueskyError({ error, action: 'refresh the Bluesky session' });
  }
  const refreshed = agent.session?.accessJwt;
  if (!refreshed) {
    throw new Error('Could not refresh the Bluesky session. Reconnect the Bluesky connection.');
  }
  return refreshed;
}

function assertSameOrigin({ url, pdsHost }: { url: unknown; pdsHost: string }): void {
  if (typeof url !== 'string' || !/^[a-z][a-z0-9+.-]*:|^\/\//i.test(url.trim())) {
    return;
  }
  let target: URL;
  try {
    target = new URL(url.trim());
  } catch {
    throw new Error('The custom API call URL is not valid.');
  }
  const base = new URL(pdsHost);
  if (target.origin !== base.origin || target.username !== '' || target.password !== '') {
    throw new Error(`Custom API calls can only go to the connection's PDS host (${base.origin}). Use a path such as /app.bsky.actor.getProfile instead of a full URL.`);
  }
}

async function getCurrentSession(auth: BlueSkyAuthType): Promise<{ did: string | undefined; handle: string | undefined }> {
  const agent = await createBlueskyAgent(auth);
  return { did: agent.session?.did, handle: agent.session?.handle };
}

export const blueskyClient = {
  DEFAULT_PDS_HOST,
  normalizePdsHost,
  createAgent: createBlueskyAgent,
  clearAgentCache,
  sessionDid,
  withBluesky,
  isXrpcError,
  toBlueskyError,
  freshAccessToken,
  assertSameOrigin,
  getCurrentSession,
};

export { createBlueskyAgent, BlueskyApiError };

type XrpcLikeError = { status: number; error: string; message: string; headers?: Record<string, string> };
