import { isPieceServerContextError, PieceAuth, Property } from '@activepieces/pieces-framework';
import { GetDocumentAnalysisCommand } from '@aws-sdk/client-textract';
import { createTextractClient, getTemporaryCredentials } from './common';

const oidcDescription = `
Connect AWS Textract using an IAM Role via OIDC. No permanent keys required.

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
   For an AWS GovCloud (US) region, use \`arn:aws-us-gov:iam::\` instead of \`arn:aws:iam::\` in the \`Federated\` principal.
3. Attach Textract permissions to the role (e.g. the \`AmazonTextractFullAccess\` policy), plus \`s3:GetObject\` on any bucket you read documents from, and paste the **Role ARN** below.
`;

const TEXTRACT_AWS_REGIONS = [
  { label: 'US East (N. Virginia) [us-east-1]', value: 'us-east-1' },
  { label: 'US East (Ohio) [us-east-2]', value: 'us-east-2' },
  { label: 'US West (N. California) [us-west-1]', value: 'us-west-1' },
  { label: 'US West (Oregon) [us-west-2]', value: 'us-west-2' },
  {
    label: 'Asia Pacific (Mumbai) [ap-south-1]',
    value: 'ap-south-1',
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
    label: 'Canada (Central) [ca-central-1]',
    value: 'ca-central-1',
  },
  {
    label: 'Europe (Frankfurt) [eu-central-1]',
    value: 'eu-central-1',
  },
  { label: 'Europe (Ireland) [eu-west-1]', value: 'eu-west-1' },
  { label: 'Europe (London) [eu-west-2]', value: 'eu-west-2' },
  { label: 'Europe (Paris) [eu-west-3]', value: 'eu-west-3' },
  { label: 'Europe (Spain) [eu-south-2]', value: 'eu-south-2' },
  {
    label: 'AWS GovCloud (US-East) [us-gov-east-1]',
    value: 'us-gov-east-1',
  },
  {
    label: 'AWS GovCloud (US-West) [us-gov-west-1]',
    value: 'us-gov-west-1',
  },
];

export const amazonTextractAccessKeyAuth = PieceAuth.CustomAuth({
  displayName: 'AWS Textract (Access Key)',
  description:
    'Authenticate with AWS using your Access Key ID and Secret Access Key. The IAM user or role must have permissions for AWS Textract (e.g., the `AmazonTextractFullAccess` managed policy).',
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
        options: TEXTRACT_AWS_REGIONS,
      },
    }),
  },
  validate: async ({ auth, server }) => {
    try {
      const client = await createTextractClient({ auth, server });
      await client.send(
        new GetDocumentAnalysisCommand({ JobId: 'validate-credentials' })
      );
      return { valid: true };
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err.name === 'InvalidJobIdException') {
        return { valid: true };
      }
      return {
        valid: false,
        error: err.message ?? 'Invalid credentials',
      };
    }
  },
  required: true,
});

export const amazonTextractOidcAuth = PieceAuth.OIDC({
  displayName: 'AWS Textract (IAM Role / OIDC)',
  description: oidcDescription,
  props: {
    roleArn: Property.ShortText({
      displayName: 'Role ARN',
      description: 'The ARN of the IAM role to assume (e.g. arn:aws:iam::123456789012:role/MyRole).',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      required: true,
      options: {
        options: TEXTRACT_AWS_REGIONS,
      },
    }),
  },
  validate: async ({ auth, server }) => {
    const arnRegex = /^arn:(?:aws|aws-us-gov|aws-cn):iam::\d{12}:role\/[\w+=,.@\-/]{1,512}$/;
    if (!arnRegex.test(auth.roleArn)) {
      return { valid: false, error: 'Invalid IAM Role ARN format. Expected: arn:aws:iam::123456789012:role/RoleName' };
    }
    try {
      await getTemporaryCredentials({ auth, server });
      return { valid: true };
    } catch (error) {
      if (isPieceServerContextError(error)) throw error;
      return { valid: false, error: formatAssumeRoleError(error) };
    }
  },
  required: true,
});

export const amazonTextractAuth = [amazonTextractAccessKeyAuth, amazonTextractOidcAuth];

function formatAssumeRoleError(error: unknown): string {
  const fallback = 'Failed to assume the IAM role. Check the role ARN and trust policy.';
  if (error instanceof Error) {
    if (error.name && error.name !== 'Error') return `${error.name}: ${error.message}`;
    return error.message || fallback;
  }
  return fallback;
}

export type TextractAccessKeyAuth = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

export type TextractOidcAuth = {
  roleArn: string;
  region: string;
};

export type TextractAuth = TextractAccessKeyAuth | TextractOidcAuth;
