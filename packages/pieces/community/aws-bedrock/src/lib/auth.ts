import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';

const bedrockOidcDescription = `
Connect your AWS account using an IAM Role via OIDC — no permanent keys required.

Activepieces acts as an OIDC identity provider. AWS trusts this provider and issues temporary credentials via \`AssumeRoleWithWebIdentity\`.

**Setup steps:**
1. In AWS IAM → Identity Providers → Create Provider:
   - Provider type: **OpenID Connect**
   - Provider URL: \`{{frontendUrl}}\`
   - Audience: \`sts.amazonaws.com\`

   > AWS fetches \`{{frontendUrl}}/.well-known/openid-configuration\` to discover the OIDC metadata. If your frontend and API run on different domains, make sure the API server is reachable at \`{{frontendUrl}}\` (or that your frontend proxies \`/.well-known/*\` to the API), otherwise \`AssumeRoleWithWebIdentity\` will fail.
2. Create an IAM Role with this trust policy:
\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/{{frontendHost}}" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "{{frontendHost}}:aud": "sts.amazonaws.com"
      },
      "StringLike": {
        "{{frontendHost}}:sub": "platform:{{platformId}}:project:{{projectId}}"
      }
    }
  }]
}
\`\`\`
3. Attach Bedrock permissions to the role (e.g. the \`AmazonBedrockFullAccess\` policy) and paste the **Role ARN** below.
`;

const BEDROCK_AWS_REGIONS = [
  { label: 'US East (N. Virginia) [us-east-1]', value: 'us-east-1' },
  { label: 'US East (Ohio) [us-east-2]', value: 'us-east-2' },
  { label: 'US West (Oregon) [us-west-2]', value: 'us-west-2' },
  { label: 'Asia Pacific (Hyderabad) [ap-south-2]', value: 'ap-south-2' },
  { label: 'Asia Pacific (Mumbai) [ap-south-1]', value: 'ap-south-1' },
  { label: 'Asia Pacific (Osaka) [ap-northeast-3]', value: 'ap-northeast-3' },
  { label: 'Asia Pacific (Seoul) [ap-northeast-2]', value: 'ap-northeast-2' },
  { label: 'Asia Pacific (Singapore) [ap-southeast-1]', value: 'ap-southeast-1' },
  { label: 'Asia Pacific (Sydney) [ap-southeast-2]', value: 'ap-southeast-2' },
  { label: 'Asia Pacific (Tokyo) [ap-northeast-1]', value: 'ap-northeast-1' },
  { label: 'Canada (Central) [ca-central-1]', value: 'ca-central-1' },
  { label: 'Europe (Frankfurt) [eu-central-1]', value: 'eu-central-1' },
  { label: 'Europe (Ireland) [eu-west-1]', value: 'eu-west-1' },
  { label: 'Europe (London) [eu-west-2]', value: 'eu-west-2' },
  { label: 'Europe (Milan) [eu-south-1]', value: 'eu-south-1' },
  { label: 'Europe (Paris) [eu-west-3]', value: 'eu-west-3' },
  { label: 'Europe (Spain) [eu-south-2]', value: 'eu-south-2' },
  { label: 'Europe (Stockholm) [eu-north-1]', value: 'eu-north-1' },
  { label: 'Europe (Zurich) [eu-central-2]', value: 'eu-central-2' },
  { label: 'South America (São Paulo) [sa-east-1]', value: 'sa-east-1' },
];

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
        options: BEDROCK_AWS_REGIONS,
      },
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = new BedrockClient({
        credentials: { accessKeyId: auth.accessKeyId, secretAccessKey: auth.secretAccessKey },
        region: auth.region,
      });
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

export const awsBedrockOidcAuth = PieceAuth.OIDC({
  displayName: 'AWS Bedrock (IAM Role / OIDC)',
  description: bedrockOidcDescription,
  props: {
    roleArn: Property.ShortText({
      displayName: 'Role ARN',
      description: 'The ARN of the IAM role to assume (e.g. arn:aws:iam::123456789012:role/MyRole).',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      options: { options: BEDROCK_AWS_REGIONS },
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    if (!auth.roleArn) {
      return { valid: false, error: 'Role ARN is required for IAM Role authentication.' };
    }
    const arnRegex = /^arn:(?:aws|aws-us-gov|aws-cn):iam::\d{12}:role\/[\w+=,.@\-/]{1,512}$/;
    if (!arnRegex.test(auth.roleArn)) {
      return { valid: false, error: 'Invalid IAM Role ARN format. Expected: arn:aws:iam::123456789012:role/RoleName' };
    }
    return { valid: true };
  },
  required: true,
});

export const awsBedrockCombinedAuth = [awsBedrockAuth, awsBedrockOidcAuth];

export type BedrockAccessKeyAuthProps = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

export type BedrockOidcAuthProps = {
  roleArn: string;
  region: string;
};

export type BedrockAuthProps = BedrockAccessKeyAuthProps | BedrockOidcAuthProps;
