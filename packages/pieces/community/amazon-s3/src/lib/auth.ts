import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { createS3 } from './common';

const accessKeyDescription = `
Connect your Amazon S3 account using AWS Access Key credentials.

**How to get your credentials:**
1. Open the [AWS IAM Console](https://console.aws.amazon.com/iam/) and go to **Users**.
2. Select your user (or create a new one), then go to **Security credentials**.
3. Click **Create access key** — copy both the Access Key ID and Secret Access Key.
4. Make sure the IAM user has the **AmazonS3FullAccess** policy (or a scoped S3 policy for your bucket).

Using a non-AWS S3-compatible service (MinIO, DigitalOcean Spaces, Backblaze B2, etc.)? Set the **Endpoint** field to your service URL.
`;

const oidcDescription = `
Connect your Amazon S3 account using an IAM Role via OIDC — no permanent keys required.

Activepieces acts as an OIDC identity provider. AWS trusts this provider and issues temporary credentials via \`AssumeRoleWithWebIdentity\`.

**Setup steps:**
1. In AWS IAM → Identity Providers → Create Provider:
   - Provider type: **OpenID Connect**
   - Provider URL: \`{{frontendUrl}}\`
   - Audience: \`sts.amazonaws.com\`
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
3. Attach S3 permissions to the role and paste the **Role ARN** below.
`;

export const AWS_REGIONS = [
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
];

export const amazonS3Auth = PieceAuth.CustomAuth({
  displayName: 'Amazon S3 (Access Key)',
  description: accessKeyDescription,
  props: {
    accessKeyId: Property.ShortText({
      displayName: 'Access Key ID',
      description: 'Your AWS access key ID. Found in AWS IAM Console → Users → Security credentials.',
      required: true,
    }),
    secretAccessKey: PieceAuth.SecretText({
      displayName: 'Secret Access Key',
      description: 'Your AWS secret access key. Only shown once when you create the access key.',
      required: true,
    }),
    endpoint: Property.ShortText({
      displayName: 'Endpoint (Optional)',
      description: 'Leave blank for Amazon S3. Only set when using MinIO, DigitalOcean Spaces, Backblaze B2, etc.',
      required: false,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      options: {
        options: AWS_REGIONS,
      },
      required: true,
    }),
    bucket: Property.ShortText({
      displayName: 'Bucket Name',
      description: 'The name of your S3 bucket (e.g. "my-company-files").',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    if (!auth.accessKeyId || !auth.secretAccessKey) {
      return { valid: false, error: 'Access Key ID and Secret Access Key are required.' };
    }
    try {
      const s3 = createS3(auth);
      await s3.listObjectsV2({ Bucket: auth.bucket, MaxKeys: 1 });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: (e as Error)?.message };
    }
  },
  required: true,
});

export const amazonS3OidcAuth = PieceAuth.OIDC({
  displayName: 'Amazon S3 (IAM Role / OIDC)',
  description: oidcDescription,
  props: {
    roleArn: Property.ShortText({
      displayName: 'Role ARN',
      description: 'The ARN of the IAM role to assume (e.g. arn:aws:iam::123456789012:role/MyRole).',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      options: {
        options: AWS_REGIONS,
      },
      required: true,
    }),
    bucket: Property.ShortText({
      displayName: 'Bucket Name',
      description: 'The name of your S3 bucket (e.g. "my-company-files").',
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

export const amazonS3CombinedAuth = [amazonS3Auth, amazonS3OidcAuth];

export type AccessKeyAuthProps = {
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  endpoint: string | undefined;
  bucket: string;
  region: string;
};

export type OidcAuthProps = {
  roleArn: string | undefined;
  bucket: string;
  region: string;
};
