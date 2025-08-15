import { isNil } from '@activepieces/shared';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SESv2Client } from '@aws-sdk/client-sesv2';

export function createSES(auth: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string | undefined;
  endpoint: string | undefined;
}) {
  const sesClient = new SESv2Client({
    credentials: {
      accessKeyId: auth.accessKeyId,
      secretAccessKey: auth.secretAccessKey,
    },
    region: auth.region,
    endpoint:
      auth.endpoint === '' || isNil(auth.endpoint) ? undefined : auth.endpoint,
  });
  return sesClient;
}
