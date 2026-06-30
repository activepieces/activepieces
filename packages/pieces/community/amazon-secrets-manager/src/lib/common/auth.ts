import { PieceAuth, Property } from '@activepieces/pieces-framework';
import {
  SecretsManagerClient,
  ListSecretsCommand,
} from '@aws-sdk/client-secrets-manager';

const secretsOidcDescription = `
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
3. Attach Secrets Manager permissions to the role (e.g. the \`SecretsManagerReadWrite\` policy) and paste the **Role ARN** below.
`;

const SECRETS_AWS_REGIONS = [
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

export const awsSecretsManagerAuth = PieceAuth.CustomAuth({
  description: '',
  props: {
    accessKeyId: PieceAuth.SecretText({
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
        options: SECRETS_AWS_REGIONS,
      },
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = new SecretsManagerClient({
        region: auth.region,
        credentials: {
          accessKeyId: auth.accessKeyId,
          secretAccessKey: auth.secretAccessKey,
        },
      });

      await client.send(new ListSecretsCommand({ MaxResults: 1 }));

      return { valid: true };
    } catch (error: unknown) {
      const name = error instanceof Error ? error.name : 'Unknown error';
      const message = error instanceof Error ? error.message : '';
      return {
        valid: false,
        error: `AWS credential validation failed: ${name} - ${message}`,
      };
    }
  },
  required: true,
});

export const awsSecretsManagerOidcAuth = PieceAuth.OIDC({
  displayName: 'AWS Secrets Manager (IAM Role / OIDC)',
  description: secretsOidcDescription,
  props: {
    roleArn: Property.ShortText({
      displayName: 'Role ARN',
      description: 'The ARN of the IAM role to assume (e.g. arn:aws:iam::123456789012:role/MyRole).',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      options: { options: SECRETS_AWS_REGIONS },
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

export const awsSecretsManagerCombinedAuth = [awsSecretsManagerAuth, awsSecretsManagerOidcAuth];

export type SecretsAccessKeyAuthProps = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

export type SecretsOidcAuthProps = {
  roleArn: string;
  region: string;
};

export type SecretsAuthProps = SecretsAccessKeyAuthProps | SecretsOidcAuthProps;
