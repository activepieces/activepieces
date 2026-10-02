import { LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

import { LambdaApiError } from './common/errors';
import { AWS_REGIONS } from './common/regions';

const accessKeyDescription = `
Connect with an IAM user's access key.

**How to get your credentials:**
1. Open the [AWS IAM Console](https://console.aws.amazon.com/iam/) and go to **Users**.
2. Select your user (or create one), then open **Security credentials**.
3. Click **Create access key** and copy the Access Key ID and the Secret Access Key.
4. Attach a policy that allows the Lambda calls this piece makes: \`lambda:ListFunctions\`, \`lambda:GetFunctionConfiguration\`, and \`lambda:InvokeFunction\`. \`AWSLambda_ReadOnlyAccess\` plus \`lambda:InvokeFunction\` covers the built-in actions. The custom action needs whatever the path you call requires.

Saving the connection calls \`ListFunctions\` once. A bad key, region, or missing permission is rejected here.
`;

const oidcDescription = `
Connect with an IAM role via OIDC. No long-lived access key is stored.

Activepieces acts as an OIDC identity provider. AWS trusts it and issues temporary credentials with \`AssumeRoleWithWebIdentity\`.

**Setup steps:**
1. In AWS IAM → Identity providers → Create provider:
   - Provider type: **OpenID Connect**
   - Provider URL: \`{{frontendUrl}}\`
   - Audience: \`sts.amazonaws.com\`

   AWS fetches \`{{frontendUrl}}/.well-known/openid-configuration\`. If the frontend and API are on different hosts, the API must be reachable at \`{{frontendUrl}}\` (or the frontend must proxy \`/.well-known/*\`).
2. Create an IAM role with this trust policy:
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
3. Attach Lambda permissions (\`lambda:ListFunctions\`, \`lambda:GetFunctionConfiguration\`, \`lambda:InvokeFunction\`) and paste the **Role ARN** below.

The role ARN is checked when you save. AWS is contacted on the first run, because connection validation does not receive a worker token.
`;

function regionProp() {
  return Property.StaticDropdown({
    displayName: 'Region',
    description: 'AWS region of the Lambda functions this connection uses. Another region needs another connection.',
    required: true,
    defaultValue: 'us-east-1',
    options: { options: AWS_REGIONS },
  });
}

export const awsLambdaAccessKeyAuth = PieceAuth.CustomAuth({
  displayName: 'AWS Lambda (Access Key)',
  description: accessKeyDescription,
  required: true,
  props: {
    accessKeyId: Property.ShortText({
      displayName: 'Access Key ID',
      description: 'Found in AWS IAM Console → Users → Security credentials.',
      required: true,
    }),
    secretAccessKey: PieceAuth.SecretText({
      displayName: 'Secret Access Key',
      description: 'Shown only once when the access key is created.',
      required: true,
    }),
    region: regionProp(),
  },
  validate: async ({ auth }) => {
    if (!auth.accessKeyId?.trim() || !auth.secretAccessKey?.trim()) {
      return { valid: false, error: 'Access Key ID and Secret Access Key are required.' };
    }
    try {
      const client = new LambdaClient({
        region: auth.region,
        credentials: {
          accessKeyId: auth.accessKeyId.trim(),
          secretAccessKey: auth.secretAccessKey.trim(),
        },
      });
      await client.send(new ListFunctionsCommand({ MaxItems: 1 }));
      return { valid: true };
    } catch (error) {
      return { valid: false, error: LambdaApiError.from(error).message };
    }
  },
});

const ROLE_ARN = /^arn:(?:aws|aws-us-gov|aws-cn):iam::\d{12}:role\/[\w+=,.@\-/]{1,512}$/;

export const awsLambdaOidcAuth = PieceAuth.OIDC({
  displayName: 'AWS Lambda (IAM Role / OIDC)',
  description: oidcDescription,
  required: true,
  props: {
    roleArn: Property.ShortText({
      displayName: 'Role ARN',
      description: 'ARN of the IAM role to assume, for example arn:aws:iam::123456789012:role/MyRole.',
      required: true,
    }),
    region: regionProp(),
  },
  validate: async ({ auth }) => {
    const roleArn = auth.roleArn?.trim() ?? '';
    if (!roleArn) {
      return { valid: false, error: 'Role ARN is required for IAM role authentication.' };
    }
    if (!ROLE_ARN.test(roleArn)) {
      return {
        valid: false,
        error: 'Invalid IAM Role ARN format. Expected: arn:aws:iam::123456789012:role/RoleName',
      };
    }
    return { valid: true };
  },
});

export const awsLambdaCombinedAuth = [awsLambdaAccessKeyAuth, awsLambdaOidcAuth];

export type AccessKeyAuthProps = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

export type OidcAuthProps = {
  roleArn: string;
  region: string;
};

export type LambdaAuthProps = AccessKeyAuthProps | OidcAuthProps;

export function isOidcAuth(auth: LambdaAuthProps): auth is OidcAuthProps {
  return 'roleArn' in auth;
}
