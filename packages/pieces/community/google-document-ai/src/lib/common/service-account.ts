import { createHash, createSign } from 'node:crypto';

import type { ServiceAccountProps } from './token';

export function normalizePrivateKey(value: string): string {
  const key = String(value ?? '')
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/\\n/g, '\n');
  if (!key.includes('-----BEGIN') || !key.includes('PRIVATE KEY-----')) {
    throw new Error('The private key must be the PEM block of the service account key file (-----BEGIN PRIVATE KEY----- … -----END PRIVATE KEY-----).');
  }
  return key;
}

export function parseServiceAccountKey(raw: unknown): ServiceAccountKey {
  const text = String(raw ?? '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  if (text === '') {
    throw new Error('Paste the service account key file (JSON) into the connection.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('The service account key is not valid JSON: paste the whole file downloaded from Google Cloud (it starts with { "type": "service_account", …).');
  }
  if (!isRecord(parsed)) {
    throw new Error('The service account key must be a JSON object.');
  }
  const type = parsed['type'];
  if (type !== undefined && type !== 'service_account') {
    throw new Error(`The key file has type "${String(type)}"; a service account key has type "service_account".`);
  }
  const rawEmail = parsed['client_email'];
  const rawPrivateKey = parsed['private_key'];
  const rawProjectId = parsed['project_id'];
  const clientEmail = typeof rawEmail === 'string' ? rawEmail.trim() : '';
  const privateKey = typeof rawPrivateKey === 'string' ? rawPrivateKey : '';
  if (!clientEmail || !privateKey) {
    throw new Error('The service account key must contain client_email and private_key.');
  }
  const projectId = typeof rawProjectId === 'string' && rawProjectId.trim() !== '' ? rawProjectId.trim() : undefined;
  return { clientEmail, privateKey: normalizePrivateKey(privateKey), ...(projectId ? { projectId } : {}) };
}

export function buildAssertion({ key, scopes, now = Math.floor(Date.now() / 1000) }: { key: ServiceAccountKey; scopes: string[]; now?: number }): string {
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(
    JSON.stringify({
      iss: key.clientEmail.trim(),
      scope: scopes.join(' '),
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + JWT_LIFETIME_SECONDS,
    })
  );
  const input = `${header}.${claims}`;
  const signature = createSign('RSA-SHA256').update(input).end().sign(normalizePrivateKey(key.privateKey), 'base64url');
  return `${input}.${signature}`;
}

export async function mintServiceAccountToken({ key, scopes }: { key: ServiceAccountKey; scopes: string[] }): Promise<string> {
  const cacheKey = `${key.clientEmail.trim()}|${privateKeyFingerprint(key.privateKey)}|${scopes.join(' ')}`;
  const now = Math.floor(Date.now() / 1000);
  const cached = readCachedToken({ cacheKey, now });
  if (cached) {
    return cached;
  }

  const { accessToken, expiresIn } = await exchangeAssertion(buildAssertion({ key, scopes, now }));
  storeCachedToken({ cacheKey, token: { accessToken, expiresAt: now + expiresIn }, now });
  return accessToken;
}

export function clearTokenCache(): void {
  tokenCache.clear();
}

export async function validateServiceAccountConnection(props: ServiceAccountProps): Promise<{ valid: true } | { valid: false; error: string }> {
  const { GoogleDocumentAiApi } = await import('./client');
  const { resolveServiceAccount } = await import('./token');
  try {
    const resolved = await resolveServiceAccount(props);
    const processors = await GoogleDocumentAiApi.listProcessors(resolved);
    if (processors.length === 0) {
      return {
        valid: false,
        error: `No processors found in project ${resolved.projectId}, location ${resolved.location}. Create one in Document AI → Processors, or check the location (us / eu).`,
      };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function privateKeyFingerprint(privateKey: string): string {
  return createHash('sha256').update(normalizePrivateKey(privateKey)).digest('hex');
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

async function exchangeAssertion(assertion: string): Promise<{ accessToken: string; expiresIn: number }> {
  let response: Response;
  try {
    response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString(),
    });
  } catch (error) {
    throw new Error(`Could not reach the Google token endpoint: ${error instanceof Error ? error.message : String(error)}`);
  }
  const body = await readJsonBody(response);
  if (!response.ok) {
    throw new Error(describeTokenError({ status: response.status, body }));
  }
  const accessToken = isRecord(body) ? optionalString(body['access_token']) : undefined;
  if (!accessToken) {
    const code = isRecord(body) ? optionalString(body['error']) : undefined;
    const description = isRecord(body) ? optionalString(body['error_description']) : undefined;
    throw new Error(`Google token endpoint returned no access token${code ? ` (${code}: ${description ?? ''})` : ''}.`);
  }
  const expiresIn = isRecord(body) ? body['expires_in'] : undefined;
  return { accessToken, expiresIn: typeof expiresIn === 'number' && expiresIn > 0 ? expiresIn : JWT_LIFETIME_SECONDS };
}

async function readJsonBody(response: Response): Promise<unknown> {
  try {
    const parsed: unknown = await response.json();
    return parsed;
  } catch {
    return undefined;
  }
}

function describeTokenError({ status, body }: { status: number; body: unknown }): string {
  if (isRecord(body)) {
    const code = optionalString(body['error']);
    const description = optionalString(body['error_description']);
    const hint =
      code === 'invalid_grant'
        ? ' Check that the key was not deleted or disabled in Google Cloud and that the server clock is right.'
        : code === 'invalid_client'
          ? ' The client_email of the key file was not recognised; paste the whole key file again.'
          : '';
    return `Google rejected the service account (${code ?? status}): ${description ?? ''}${hint}`.trim();
  }
  return `Google token endpoint returned ${status}.`;
}

function readCachedToken({ cacheKey, now }: { cacheKey: string; now: number }): string | undefined {
  sweepExpiredTokens(now);
  return tokenCache.get(cacheKey)?.accessToken;
}

function storeCachedToken({ cacheKey, token, now }: { cacheKey: string; token: CachedToken; now: number }): void {
  sweepExpiredTokens(now);
  tokenCache.delete(cacheKey);
  tokenCache.set(cacheKey, token);
  for (const oldest of tokenCache.keys()) {
    if (tokenCache.size <= MAX_CACHED_TOKENS) break;
    tokenCache.delete(oldest);
  }
}

function sweepExpiredTokens(now: number): void {
  for (const [cacheKey, token] of tokenCache) {
    if (token.expiresAt - REFRESH_MARGIN_SECONDS <= now) {
      tokenCache.delete(cacheKey);
    }
  }
}

const JWT_LIFETIME_SECONDS = 3600;
const REFRESH_MARGIN_SECONDS = 300;
const MAX_CACHED_TOKENS = 100;

const tokenCache = new Map<string, CachedToken>();

export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export type ServiceAccountKey = {
  clientEmail: string;
  privateKey: string;
  projectId?: string;
};

type CachedToken = { accessToken: string; expiresAt: number };
