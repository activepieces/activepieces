import { isNil } from '@activepieces/shared';
import { S3 } from '@aws-sdk/client-s3';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { AssumeRoleWithWebIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { ServerContext } from '@activepieces/pieces-framework';
import { AccessKeyAuthProps, OidcAuthProps } from './auth';

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

export async function createSecretsManagerWithAssumeRole({
  auth,
  server,
  region,
}: {
  auth: OidcAuthProps;
  server: ServerContext;
  region?: string;
}): Promise<SecretsManagerClient> {
  const credentials = await getTemporaryCredentials({ auth, server });
  return new SecretsManagerClient({
    credentials,
    region: region ?? auth.region,
  });
}

export async function resolveS3Client({
  authProps,
  server,
}: {
  authProps: AccessKeyAuthProps | OidcAuthProps;
  server: ServerContext;
}): Promise<S3> {
  return 'roleArn' in authProps
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

  const clampedDuration = Math.min(Math.max(durationSeconds, MIN_STS_DURATION_SECONDS), MAX_STS_DURATION_SECONDS);
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
  return {
    accessKeyId: Credentials.AccessKeyId,
    secretAccessKey: Credentials.SecretAccessKey,
    sessionToken: Credentials.SessionToken,
  };
}

const DEFAULT_STS_DURATION_SECONDS = 3600;

export const MIN_STS_DURATION_SECONDS = 900;
export const MAX_STS_DURATION_SECONDS = 43200;
