import { isNil } from '@activepieces/shared';
import { S3 } from '@aws-sdk/client-s3';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { AssumeRoleWithWebIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { ServerContext } from '@activepieces/pieces-framework';
import { AccessKeyAuthProps, OidcAuthProps, S3AuthProps } from './auth';

const AWS_STS_AUDIENCE = 'sts.amazonaws.com';

export function createS3(auth: AccessKeyAuthProps) {
  if (!auth.accessKeyId || !auth.secretAccessKey) {
    throw new Error('Access Key ID and Secret Access Key are required');
  }
  const s3 = new S3({
    credentials: {
      accessKeyId: auth.accessKeyId,
      secretAccessKey: auth.secretAccessKey,
    },
    forcePathStyle: auth.endpoint ? true : undefined,
    region: auth.region,
    endpoint:
      auth.endpoint === '' || isNil(auth.endpoint) ? undefined : auth.endpoint,
  });
  return s3;
}

export function createSecretsManagerClient(auth: AccessKeyAuthProps) {
  if (!auth.accessKeyId || !auth.secretAccessKey) {
    throw new Error('Access Key ID and Secret Access Key are required');
  }
  const client = new SecretsManagerClient({
    credentials: {
      accessKeyId: auth.accessKeyId,
      secretAccessKey: auth.secretAccessKey,
    },
    region: auth.region,
    endpoint: undefined,
  });
  return client;
}

export async function createS3WithAssumeRole({
  auth,
  server,
  durationSeconds,
}: {
  auth: OidcAuthProps;
  server: ServerContext;
  durationSeconds?: number;
}): Promise<S3> {
  const credentials = await getTemporaryCredentials({ auth, server, durationSeconds });
  return new S3({
    credentials,
    region: auth.region,
  });
}

export function isOidcAuth(authProps: S3AuthProps): authProps is OidcAuthProps {
  return 'roleArn' in authProps;
}

export async function resolveS3Client({
  authProps,
  server,
}: {
  authProps: S3AuthProps;
  server: ServerContext;
}): Promise<S3> {
  return isOidcAuth(authProps)
    ? createS3WithAssumeRole({ auth: authProps, server })
    : createS3(authProps);
}

export async function getTemporaryCredentials({
  auth,
  server,
  durationSeconds = DEFAULT_STS_DURATION_SECONDS,
}: {
  auth: OidcAuthProps;
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
