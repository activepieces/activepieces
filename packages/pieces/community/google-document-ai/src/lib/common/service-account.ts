import { createHash, createSign } from 'node:crypto';

import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';

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
  const cached = tokenCache.get(cacheKey);
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt - REFRESH_MARGIN_SECONDS > now) {
    return cached.accessToken;
  }

  let body: TokenResponse;
  try {
    const response = await httpClient.sendRequest<TokenResponse>({
      method: HttpMethod.POST,
      url: GOOGLE_TOKEN_URL,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: buildAssertion({ key, scopes, now }),
      }).toString(),
    });
    body = response.body;
  } catch (error) {
    throw new Error(describeTokenError(error), { cause: error });
  }

  if (!body.access_token) {
    throw new Error(`Google token endpoint returned no access token${body.error ? ` (${body.error}: ${body.error_description ?? ''})` : ''}.`);
  }
  tokenCache.set(cacheKey, { accessToken: body.access_token, expiresAt: now + (body.expires_in ?? JWT_LIFETIME_SECONDS) });
  return body.access_token;
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

function describeTokenError(error: unknown): string {
  if (error instanceof HttpError) {
    const body: unknown = error.response.body;
    if (isRecord(body)) {
      const code = optionalString(body['error']);
      const description = optionalString(body['error_description']);
      const hint =
        code === 'invalid_grant'
          ? ' Check that the key was not deleted or disabled in Google Cloud and that the server clock is right.'
          : code === 'invalid_client'
            ? ' The client_email of the key file was not recognised; paste the whole key file again.'
            : '';
      return `Google rejected the service account (${code ?? error.response.status}): ${description ?? ''}${hint}`.trim();
    }
    return `Google token endpoint returned ${error.response.status}.`;
  }
  return error instanceof Error ? error.message : String(error);
}

const JWT_LIFETIME_SECONDS = 3600;
const REFRESH_MARGIN_SECONDS = 300;

const tokenCache = new Map<string, CachedToken>();

export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export type ServiceAccountKey = {
  clientEmail: string;
  privateKey: string;
  projectId?: string;
};

type TokenResponse = { access_token?: string; expires_in?: number; error?: string; error_description?: string };

type CachedToken = { accessToken: string; expiresAt: number };
