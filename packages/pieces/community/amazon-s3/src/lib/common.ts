import { isNil } from '@activepieces/shared';
import { S3 } from '@aws-sdk/client-s3';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

export function createS3(auth: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string | undefined;
  endpoint: string | undefined;
}) {
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

export function createSecretsManagerClient(auth: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string | undefined;
}) {
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
