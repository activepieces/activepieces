import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { createBedrockClient } from './common';
import { ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';

export const awsBedrockAuth = PieceAuth.CustomAuth({
  description: `Connect your AWS account to use Amazon Bedrock AI models.

**How to get your credentials:**
1. Open the [AWS IAM Console](https://console.aws.amazon.com/iam/) and go to **Users**.
2. Select your user (or create a new one), then go to **Security credentials**.
3. Click **Create access key** — copy both the Access Key ID and Secret Access Key.
4. Make sure the IAM user has the **AmazonBedrockFullAccess** policy attached.

**Enable model access:** In the [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/), go to **Model access** and request access to the models you want to use.`,
  props: {
    accessKeyId: Property.ShortText({
      displayName: 'Access Key ID',
      description: 'Your AWS access key ID. Found in AWS IAM Console → Users → Security credentials.',
      required: true,
    }),
    secretAccessKey: PieceAuth.SecretText({
      displayName: 'Secret Access Key',
      description: 'Your AWS secret access key. Only shown once when you create the access key — store it safely.',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      required: true,
      options: {
        options: [
          { label: 'US East (N. Virginia) [us-east-1]', value: 'us-east-1' },
          { label: 'US East (Ohio) [us-east-2]', value: 'us-east-2' },
          { label: 'US West (Oregon) [us-west-2]', value: 'us-west-2' },
          {
            label: 'Asia Pacific (Hyderabad) [ap-south-2]',
            value: 'ap-south-2',
          },
          {
            label: 'Asia Pacific (Mumbai) [ap-south-1]',
            value: 'ap-south-1',
          },
          {
            label: 'Asia Pacific (Osaka) [ap-northeast-3]',
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
          { label: 'Europe (Ireland) [eu-west-1]', value: 'eu-west-1' },
          { label: 'Europe (London) [eu-west-2]', value: 'eu-west-2' },
          { label: 'Europe (Milan) [eu-south-1]', value: 'eu-south-1' },
          { label: 'Europe (Paris) [eu-west-3]', value: 'eu-west-3' },
          { label: 'Europe (Spain) [eu-south-2]', value: 'eu-south-2' },
          {
            label: 'Europe (Stockholm) [eu-north-1]',
            value: 'eu-north-1',
          },
          {
            label: 'Europe (Zurich) [eu-central-2]',
            value: 'eu-central-2',
          },
          {
            label: 'South America (São Paulo) [sa-east-1]',
            value: 'sa-east-1',
          },
        ],
      },
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = createBedrockClient(auth);
      await client.send(new ListFoundationModelsCommand({}));
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: (e as Error)?.message,
      };
    }
  },
  required: true,
});
