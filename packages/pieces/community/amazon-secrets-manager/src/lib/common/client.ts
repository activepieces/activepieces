import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { AssumeRoleWithWebIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { ServerContext } from '@activepieces/pieces-framework';
import { SecretsAuthProps, SecretsOidcAuthProps } from './auth';

const AWS_STS_AUDIENCE = 'sts.amazonaws.com';

export function isOidcAuth(auth: SecretsAuthProps): auth is SecretsOidcAuthProps {
  return 'roleArn' in auth;
}

export async function resolveSecretsManagerClient({
  auth,
  server,
}: {
  auth: SecretsAuthProps;
  server: ServerContext;
}): Promise<SecretsManagerClient> {
  if (isOidcAuth(auth)) {
    const credentials = await getTemporaryCredentials({ auth, server });
    return new SecretsManagerClient({ credentials, region: auth.region });
  }
  return new SecretsManagerClient({
    region: auth.region,
    credentials: { accessKeyId: auth.accessKeyId, secretAccessKey: auth.secretAccessKey },
  });
}

export async function getTemporaryCredentials({
  auth,
  server,
  durationSeconds = DEFAULT_STS_DURATION_SECONDS,
}: {
  auth: SecretsOidcAuthProps;
  server: ServerContext;
  durationSeconds?: number;
}) {
  if (!auth.roleArn) {
    throw new Error('Role ARN is required for IAM Role authentication');
  }
  const clampedDuration = Math.min(Math.max(durationSeconds, MIN_STS_DURATION_SECONDS), MAX_STS_DURATION_SECONDS);

  // Scoped by server.token (unique per flow execution) so credentials are never reused
  // across projects/tenants, only across steps within the same run.
  const cacheKey = `${server.token}:${auth.roleArn}:${auth.region}:${clampedDuration}`;
  const cached = credentialsCache.get(cacheKey);
  if (cached && cached.expiresAtMS - Date.now() > CREDENTIALS_EXPIRY_MARGIN_MS) {
    return cached.credentials;
  }

  const response = await fetch(`${server.apiUrl}v1/worker/oidc-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${server.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audience: AWS_STS_AUDIENCE }),
  });
  if (!response.ok) {
    throw new Error(`Failed to get OIDC token: ${response.statusText}`);
  }
  const { token } = (await response.json()) as { token: string };

  const sts = new STSClient({ region: auth.region });
  const { Credentials } = await sts.send(
    new AssumeRoleWithWebIdentityCommand({
      RoleArn: auth.roleArn,
      RoleSessionName: 'activepieces-execution',
      WebIdentityToken: token,
      DurationSeconds: clampedDuration,
    }),
  );
  if (!Credentials?.AccessKeyId || !Credentials.SecretAccessKey) {
    throw new Error('Failed to assume role: no credentials returned');
  }
  const credentials = {
    accessKeyId: Credentials.AccessKeyId,
    secretAccessKey: Credentials.SecretAccessKey,
    sessionToken: Credentials.SessionToken,
  };
  const expiresAtMS = Credentials.Expiration?.getTime() ?? Date.now() + clampedDuration * 1000;
  sweepExpiredCredentials();
  credentialsCache.set(cacheKey, { credentials, expiresAtMS });
  return credentials;
}

function sweepExpiredCredentials() {
  const now = Date.now();
  for (const [key, value] of credentialsCache) {
    if (value.expiresAtMS <= now) {
      credentialsCache.delete(key);
    }
  }
}

const DEFAULT_STS_DURATION_SECONDS = 3600;
const CREDENTIALS_EXPIRY_MARGIN_MS = 5 * 60 * 1000;
const credentialsCache = new Map<string, CachedCredentials>();

export const MIN_STS_DURATION_SECONDS = 900;
export const MAX_STS_DURATION_SECONDS = 43200;

type TemporaryCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string | undefined;
};

type CachedCredentials = {
  credentials: TemporaryCredentials;
  expiresAtMS: number;
};
