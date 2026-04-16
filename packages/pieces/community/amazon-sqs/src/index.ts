
import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { ListQueuesCommand, SQS } from '@aws-sdk/client-sqs';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { sendMessage } from "./lib/actions/send-message";

export const amazonSqsAuth = PieceAuth.CustomAuth({
  props: {
    authType: Property.StaticDropdown({
      displayName: 'Auth Method',
      description: 'Choose how to authenticate with AWS.',
      required: true,
      defaultValue: 'direct',
      options: {
        options: [
          { label: 'Direct Credentials (Access Key + Secret)', value: 'direct' },
          { label: 'AssumeRole (temporary credentials via STS)', value: 'assume_role' },
        ],
      },
    }),
    accessKeyId: Property.ShortText({
      displayName: 'Access Key ID',
      required: true,
    }),
    secretAccessKey: PieceAuth.SecretText({
      displayName: 'Secret Access Key',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      options: {
        options: [
          {
            label: 'Default',
            value: 'us-east-1',
          },
          {
            label: 'US East (N. Virginia) [us-east-1]',
            value: 'us-east-1',
          },
          {
            label: 'US East (Ohio) [us-east-2]',
            value: 'us-east-2',
          },
          {
            label: 'US West (N. California) [us-west-1]',
            value: 'us-west-1',
          },
          {
            label: 'US West (Oregon) [us-west-2]',
            value: 'us-west-2',
          },
          {
            label: 'Africa (Cape Town) [af-south-1]',
            value: 'af-south-1',
          },
          {
            label: 'Asia Pacific (Hong Kong) [ap-east-1]',
            value: 'ap-east-1',
          },
          {
            label: 'Asia Pacific (Mumbai) [ap-south-1]',
            value: 'ap-south-1',
          },
          {
            label: 'Asia Pacific (Osaka-Local) [ap-northeast-3]',
            value: 'ap-northeast-3',
          },
          {
            label: 'Asia Pacific (Seoul) [ap-northeast-2]',
            value: 'ap-northeast-2',
          },
          {
            label: 'Asia Pacific (Singapore) [ap-southeast-1]',
            value: 'ap-southeast-1',
          },
          {
            label: 'Asia Pacific (Sydney) [ap-southeast-2]',
            value: 'ap-southeast-2',
          },
          {
            label: 'Asia Pacific (Tokyo) [ap-northeast-1]',
            value: 'ap-northeast-1',
          },
          {
            label: 'Canada (Central) [ca-central-1]',
            value: 'ca-central-1',
          },
          {
            label: 'Europe (Frankfurt) [eu-central-1]',
            value: 'eu-central-1',
          },
          {
            label: 'Europe (Ireland) [eu-west-1]',
            value: 'eu-west-1',
          },
          {
            label: 'Europe (London) [eu-west-2]',
            value: 'eu-west-2',
          },
          {
            label: 'Europe (Milan) [eu-south-1]',
            value: 'eu-south-1',
          },
          {
            label: 'Europe (Paris) [eu-west-3]',
            value: 'eu-west-3',
          },
          {
            label: 'Europe (Stockholm) [eu-north-1]',
            value: 'eu-north-1',
          },
          {
            label: 'Middle East (Bahrain) [me-south-1]',
            value: 'me-south-1',
          },
          {
            label: 'South America (São Paulo) [sa-east-1]',
            value: 'sa-east-1',
          },
          {
            label: 'Europe (Spain) [eu-south-2]',
            value: 'eu-south-2',
          },
          {
            label: 'Asia Pacific (Hyderabad) [ap-south-2]',
            value: 'ap-south-2',
          },
          {
            label: 'Asia Pacific (Jakarta) [ap-southeast-3]',
            value: 'ap-southeast-3',
          },
          {
            label: 'Asia Pacific (Melbourne) [ap-southeast-4]',
            value: 'ap-southeast-4',
          },
          {
            label: 'China (Beijing) [cn-north-1]',
            value: 'cn-north-1',
          },
          {
            label: 'China (Ningxia) [cn-northwest-1]',
            value: 'cn-northwest-1',
          },
          {
            label: 'Europe (Zurich) [eu-central-2]',
            value: 'eu-central-2',
          },
          {
            label: 'Middle East (UAE) [me-central-1]',
            value: 'me-central-1',
          },
        ],
      },
      required: true,
    }),
    roleArn: Property.ShortText({
      displayName: 'Role ARN',
      description:
        'Required when Auth Method is AssumeRole. ARN of the IAM Role to assume (e.g. arn:aws:iam::123456789012:role/MyRole).',
      required: false,
    }),
    externalId: PieceAuth.SecretText({
      displayName: 'External ID',
      description: 'Optional. Only used with AssumeRole. External ID for cross-account role security.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    if (auth.authType === 'assume_role' && !auth.roleArn) {
      return { valid: false, error: 'Role ARN is required when Auth Method is AssumeRole.' };
    }
    try {
      const sqs = await createSqs(auth);
      await sqs.send(new ListQueuesCommand({}));
      return { valid: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { valid: false, error: message };
    }
  },
  required: true,
});

export async function createSqs(auth: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  authType?: string;
  roleArn?: string;
  externalId?: string;
}) {
  const creds = await resolveAwsCredentials(auth);
  return new SQS({ credentials: creds, region: auth.region });
}

export const awsSqs = createPiece({
  displayName: "Amazon SQS",
  auth: amazonSqsAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: "https://cdn.activepieces.com/pieces/aws-sqs.png",
  authors: ["abuaboud"],
  actions: [sendMessage],
  triggers: [],
});

async function resolveAwsCredentials(auth: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
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
