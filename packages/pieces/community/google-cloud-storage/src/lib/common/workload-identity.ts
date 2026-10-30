import type { AuthValidationServerContext, ServerContext } from '@activepieces/pieces-framework';

import type { GoogleCloudStorageAccessToken, GoogleCloudStorageWorkloadIdentityProps } from './types';
import { gcsUtils } from './utils';

function buildAudience({ projectNumber, poolId, providerId }: GoogleCloudStorageWorkloadIdentityProps): string {
  return `//iam.googleapis.com/projects/${projectNumber.trim()}/locations/global/workloadIdentityPools/${poolId.trim()}/providers/${providerId.trim()}`;
}

async function exchangeAccessToken({
  props,
  server,
}: {
  props: GoogleCloudStorageWorkloadIdentityProps;
  server: ServerContext | AuthValidationServerContext;
}): Promise<string> {
  assertValidProps(props);
  const audience = buildAudience(props);
  const serviceAccountEmail = props.serviceAccountEmail?.trim() || undefined;

  const cacheKey = 'token' in server ? `${server.token}:${audience}:${serviceAccountEmail ?? ''}` : undefined;
  if (cacheKey) {
    const cached = accessTokenCache.get(cacheKey);
    if (cached && cached.expiresAtMS - Date.now() > EXPIRY_MARGIN_MS) {
      return cached.accessToken;
    }
  }

  const subjectToken = await resolveOidcToken({ server, audience });
  const federated = await exchangeWithSts({ audience, subjectToken });
  const result = serviceAccountEmail
    ? await impersonateServiceAccount({ serviceAccountEmail, federatedToken: federated.accessToken })
    : federated;

  if (cacheKey) {
    sweepExpiredTokens();
    accessTokenCache.set(cacheKey, result);
  }
  return result.accessToken;
}

function formatError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Failed to exchange the OIDC token with Google Cloud. Check the project number, pool, provider and service account.';
}

function assertValidProps(props: GoogleCloudStorageWorkloadIdentityProps): void {
  if (!PROJECT_NUMBER_REGEX.test(props.projectNumber?.trim() ?? '')) {
    throw new Error('Project Number must be the numeric project number (e.g. 123456789012), not the project ID.');
  }
  if (!RESOURCE_ID_REGEX.test(props.poolId?.trim() ?? '')) {
    throw new Error('Workload Identity Pool ID is invalid. Use the pool ID shown in IAM > Workload Identity Federation.');
  }
  if (!RESOURCE_ID_REGEX.test(props.providerId?.trim() ?? '')) {
    throw new Error('Workload Identity Provider ID is invalid. Use the provider ID shown in IAM > Workload Identity Federation.');
  }
  const serviceAccountEmail = props.serviceAccountEmail?.trim();
  if (serviceAccountEmail && !SERVICE_ACCOUNT_EMAIL_REGEX.test(serviceAccountEmail)) {
    throw new Error('Service Account Email is invalid. Expected something like name@project-id.iam.gserviceaccount.com.');
  }
}

async function resolveOidcToken({
  server,
  audience,
}: {
  server: ServerContext | AuthValidationServerContext;
  audience: string;
}): Promise<string> {
  if ('mintOidcToken' in server) {
    return server.mintOidcToken({ audience });
  }
  const response = await fetch(`${server.apiUrl}v1/worker/oidc-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${server.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audience }),
  });
  const token = gcsUtils.stringField(await readJson(response), 'token');
  if (!response.ok || !token) {
    throw new Error(`Failed to get OIDC token from Activepieces (HTTP ${response.status}).`);
  }
  return token;
}

async function exchangeWithSts({
  audience,
  subjectToken,
}: {
  audience: string;
  subjectToken: string;
}): Promise<GoogleCloudStorageAccessToken> {
  const response = await fetch(GOOGLE_STS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
      audience,
      scope: CLOUD_PLATFORM_SCOPE,
      requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
      subjectTokenType: 'urn:ietf:params:oauth:token-type:jwt',
      subjectToken,
    }),
  });
  const body = await readJson(response);
  if (!response.ok) {
    const detail = gcsUtils.trimTrailingPeriod(
      gcsUtils.stringField(body, 'error_description') ?? gcsUtils.stringField(body, 'error') ?? `HTTP ${response.status}`,
    );
    throw new Error(`Google STS rejected the OIDC token: ${detail}. Check the pool/provider, issuer URI and attribute condition.`);
  }
  const accessToken = gcsUtils.stringField(body, 'access_token');
  if (!accessToken) {
    throw new Error('Google STS returned no access token.');
  }
  const expiresInSeconds = gcsUtils.numberField(body, 'expires_in') ?? DEFAULT_TOKEN_TTL_SECONDS;
  return { accessToken, expiresAtMS: Date.now() + expiresInSeconds * 1000 };
}

async function impersonateServiceAccount({
  serviceAccountEmail,
  federatedToken,
}: {
  serviceAccountEmail: string;
  federatedToken: string;
}): Promise<GoogleCloudStorageAccessToken> {
  const response = await fetch(
    `${GOOGLE_IAM_CREDENTIALS_URL}/projects/-/serviceAccounts/${encodeURIComponent(serviceAccountEmail)}:generateAccessToken`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${federatedToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scope: [CLOUD_PLATFORM_SCOPE], lifetime: `${DEFAULT_TOKEN_TTL_SECONDS}s` }),
    },
  );
  const body = await readJson(response);
  if (!response.ok) {
    const apiError = gcsUtils.recordField(body, 'error');
    const detail = gcsUtils.trimTrailingPeriod(gcsUtils.stringField(apiError, 'message') ?? `HTTP ${response.status}`);
    const hint = isMissingImpersonationPermission({ status: response.status, apiError })
      ? ' Grant roles/iam.workloadIdentityUser on the service account to the federated principal.'
      : '';
    throw new Error(`Could not impersonate service account ${serviceAccountEmail}: ${detail}.${hint}`);
  }
  const accessToken = gcsUtils.stringField(body, 'accessToken');
  if (!accessToken) {
    throw new Error('Google IAM Credentials returned no access token.');
  }
  const expireTime = gcsUtils.stringField(body, 'expireTime');
  const expiresAtMS = expireTime ? Date.parse(expireTime) : Date.now() + DEFAULT_TOKEN_TTL_SECONDS * 1000;
  return { accessToken, expiresAtMS };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function isMissingImpersonationPermission({
  status,
  apiError,
}: {
  status: number;
  apiError: Record<string, unknown> | undefined;
}): boolean {
  const reasons = gcsUtils.arrayField(apiError, 'details').map((detail) => gcsUtils.stringField(detail, 'reason'));
  return status === 403 && !reasons.includes('SERVICE_DISABLED');
}

function sweepExpiredTokens(): void {
  const now = Date.now();
  for (const [key, value] of accessTokenCache) {
    if (value.expiresAtMS <= now) {
      accessTokenCache.delete(key);
    }
  }
}

function clearCache(): void {
  accessTokenCache.clear();
}

export const gcsWorkloadIdentity = { buildAudience, exchangeAccessToken, formatError, clearCache };

const GOOGLE_STS_URL = 'https://sts.googleapis.com/v1/token';
const GOOGLE_IAM_CREDENTIALS_URL = 'https://iamcredentials.googleapis.com/v1';
const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const DEFAULT_TOKEN_TTL_SECONDS = 3600;
const EXPIRY_MARGIN_MS = 5 * 60 * 1000;
const PROJECT_NUMBER_REGEX = /^\d{6,20}$/;
const RESOURCE_ID_REGEX = /^[a-z0-9-]{3,63}$/;
const SERVICE_ACCOUNT_EMAIL_REGEX = /^[a-zA-Z0-9-]+@[a-zA-Z0-9.-]+\.iam\.gserviceaccount\.com$/;
const accessTokenCache = new Map<string, GoogleCloudStorageAccessToken>();
