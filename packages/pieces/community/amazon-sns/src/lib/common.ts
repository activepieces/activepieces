import { isNil } from '@activepieces/shared';
import { SNSClient } from '@aws-sdk/client-sns';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';

export async function createSNS(auth: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string | undefined;
  endpoint: string | undefined;
  authType?: string;
  roleArn?: string;
  externalId?: string;
}) {
  const creds = await resolveAwsCredentials(auth);
  return new SNSClient({
    credentials: creds,
    region: auth.region,
    endpoint: auth.endpoint === '' || isNil(auth.endpoint) ? undefined : auth.endpoint,
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
