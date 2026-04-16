import { isNil } from '@activepieces/shared';
import { S3 } from '@aws-sdk/client-s3';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';

export async function createS3(auth: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string | undefined;
  endpoint: string | undefined;
  authType?: string;
  roleArn?: string;
  externalId?: string;
}) {
  const creds = await resolveAwsCredentials(auth);
  return new S3({
    credentials: creds,
    forcePathStyle: auth.endpoint ? true : undefined,
    region: auth.region,
    endpoint: auth.endpoint === '' || isNil(auth.endpoint) ? undefined : auth.endpoint,
  });
}

export async function createSecretsManagerClient(auth: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string | undefined;
  authType?: string;
  roleArn?: string;
  externalId?: string;
}) {
  const creds = await resolveAwsCredentials(auth);
  return new SecretsManagerClient({
    credentials: creds,
    region: auth.region,
    endpoint: undefined,
  });
}

async function resolveAwsCredentials(auth: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string | undefined;
  authType?: string;
  roleArn?: string;
  externalId?: string;
}) {
  if (auth.authType !== 'assume_role' || !auth.roleArn) {
    return { accessKeyId: auth.accessKeyId, secretAccessKey: auth.secretAccessKey };
  }
  const sts = new STSClient({
    credentials: { accessKeyId: auth.accessKeyId, secretAccessKey: auth.secretAccessKey },
    region: auth.region,
  });
  const { Credentials } = await sts.send(
    new AssumeRoleCommand({
      RoleArn: auth.roleArn,
      RoleSessionName: 'activepieces-session',
      ...(auth.externalId ? { ExternalId: auth.externalId } : {}),
    }),
  );
  if (!Credentials?.AccessKeyId || !Credentials?.SecretAccessKey) {
    throw new Error('AWS STS returned empty credentials. Verify the Role ARN and permissions.');
  }
  return {
    accessKeyId: Credentials.AccessKeyId,
    secretAccessKey: Credentials.SecretAccessKey,
    sessionToken: Credentials.SessionToken,
  };
}
