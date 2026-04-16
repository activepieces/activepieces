import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { createSNS } from './lib/common';
import { ListTopicsCommand } from '@aws-sdk/client-sns';
import { sendMessageAction } from './lib/actions/send-message';

const description = `
This piece allows you to send messages to Amazon SNS topics.

Refer to [this](https://docs.aws.amazon.com/general/latest/gr/sns.html) for **Region**. Leave the **Endpoint** blank. 
`;

export const amazonSnsAuth = PieceAuth.CustomAuth({
  description: description,
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
    endpoint: Property.ShortText({
      displayName: 'Endpoint',
      required: false,
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
      const sns = await createSNS(auth);
      const command = new ListTopicsCommand({});
      await sns.send(command);
      return {
        valid: true,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return {
        valid: false,
        error: message,
      };
    }
  },
  required: true,
});

export const amazonSns = createPiece({
  displayName: "Amazon SNS",
  auth: amazonSnsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/amazon-sns.png",
  authors: ["coat"],
  actions: [sendMessageAction],
  triggers: [],
});
