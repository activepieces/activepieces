import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { createSqsClient, loadSqs, isAccessDenied } from './common/client';

export const amazonSqsAuth = PieceAuth.CustomAuth({
  props: {
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
          {
            label: 'Canada West (Calgary) [ca-west-1]',
            value: 'ca-west-1',
          },
          {
            label: 'Israel (Tel Aviv) [il-central-1]',
            value: 'il-central-1',
          },
          {
            label: 'Asia Pacific (Malaysia) [ap-southeast-5]',
            value: 'ap-southeast-5',
          },
          {
            label: 'Asia Pacific (Thailand) [ap-southeast-7]',
            value: 'ap-southeast-7',
          },
          {
            label: 'Mexico (Central) [mx-central-1]',
            value: 'mx-central-1',
          },
          {
            label: 'AWS GovCloud (US-West) [us-gov-west-1]',
            value: 'us-gov-west-1',
          },
          {
            label: 'AWS GovCloud (US-East) [us-gov-east-1]',
            value: 'us-gov-east-1',
          },
        ],
      },
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const sqs = await loadSqs();
      const client = await createSqsClient({ auth: auth });
      await client.send(new sqs.ListQueuesCommand({ MaxResults: 1 }));
      return { valid: true };
    } catch (e) {
      if (isAccessDenied(e)) {
        return { valid: true };
      }
      return {
        valid: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
  required: true,
});
