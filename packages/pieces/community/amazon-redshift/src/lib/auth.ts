import { AppConnectionType, isPieceServerContextError, PieceAuth, Property } from '@activepieces/pieces-framework';
import { redshiftClient } from './common/client';

const AWS_REGIONS = [
  { label: 'US East (N. Virginia) [us-east-1]', value: 'us-east-1' },
  { label: 'US East (Ohio) [us-east-2]', value: 'us-east-2' },
  { label: 'US West (N. California) [us-west-1]', value: 'us-west-1' },
  { label: 'US West (Oregon) [us-west-2]', value: 'us-west-2' },
  { label: 'Africa (Cape Town) [af-south-1]', value: 'af-south-1' },
  { label: 'Asia Pacific (Hong Kong) [ap-east-1]', value: 'ap-east-1' },
  { label: 'Asia Pacific (Hyderabad) [ap-south-2]', value: 'ap-south-2' },
  { label: 'Asia Pacific (Jakarta) [ap-southeast-3]', value: 'ap-southeast-3' },
  { label: 'Asia Pacific (Melbourne) [ap-southeast-4]', value: 'ap-southeast-4' },
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
  { label: 'Middle East (Bahrain) [me-south-1]', value: 'me-south-1' },
  { label: 'Middle East (UAE) [me-central-1]', value: 'me-central-1' },
  { label: 'South America (São Paulo) [sa-east-1]', value: 'sa-east-1' },
];

const ROLE_ARN = /^arn:(?:aws|aws-us-gov|aws-cn):iam::\d{12}:role\/[\w+=,.@\-/]{1,512}$/;

const passwordDescription = `
Connect straight to your cluster or Serverless workgroup with a database user.

**Where to find the values:**
1. Open the [Amazon Redshift console](https://console.aws.amazon.com/redshiftv2/).
2. Open your cluster (or **Serverless** → your workgroup) and copy the **Endpoint**. It looks like \`my-workgroup.123456789012.us-east-1.redshift-serverless.amazonaws.com:5439/dev\`: the part before \`:\` is the **Host**, the number is the **Port** and the part after \`/\` is the **Database**.
3. Use the admin user, or a database user created with \`CREATE USER\`.

The cluster must accept connections from Activepieces: turn on **Publicly accessible** and allow port 5439 in its security group. For a private cluster, use the IAM Role connection instead.
`;

const iamDescription = `
Connect through the Redshift Data API with an IAM role. No password or open port is needed, so this works for private clusters.

Activepieces acts as an OIDC identity provider. AWS trusts it and issues temporary credentials with \`AssumeRoleWithWebIdentity\`.

**Setup steps:**
1. In AWS IAM → Identity providers → Create provider:
   - Provider type: **OpenID Connect**
   - Provider URL: \`{{frontendUrl}}\`
   - Audience: \`sts.amazonaws.com\`

   AWS fetches \`{{frontendUrl}}/.well-known/openid-configuration\`, so that URL must be reachable from the internet.
2. Create an IAM role with this trust policy:
\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/{{frontendHost}}" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "{{frontendHost}}:aud": "sts.amazonaws.com" },
      "StringLike": { "{{frontendHost}}:sub": "platform:{{platformId}}:project:{{projectId}}" }
    }
  }]
}
\`\`\`
3. Attach the **AmazonRedshiftDataFullAccess** policy to the role and paste the **Role ARN** below.
4. Fill in **Workgroup Name** for Serverless, or **Cluster Identifier** for a provisioned cluster.

For Serverless, the role signs in to the database as \`IAMR:<role name>\`. Grant that user access to your tables, for example \`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "IAMR:MyRole";\`.
`;

export const redshiftPasswordAuth = PieceAuth.CustomAuth({
  displayName: 'Username & Password',
  description: passwordDescription,
  required: true,
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      description: 'The endpoint without the port and database.',
      placeholder: 'my-workgroup.123456789012.us-east-1.redshift-serverless.amazonaws.com',
      required: true,
    }),
    port: Property.Number({
      displayName: 'Port',
      description: 'Usually 5439.',
      defaultValue: 5439,
      required: true,
    }),
    database: Property.ShortText({
      displayName: 'Database',
      description: 'The database to connect to. New Redshift databases are named "dev".',
      defaultValue: 'dev',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'Username',
      description: 'The database user to sign in as.',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'The password for that user.',
      required: true,
    }),
    enable_ssl: Property.Checkbox({
      displayName: 'Enable SSL',
      description: 'Encrypt the connection and verify the server certificate. Keep it on unless your cluster has SSL turned off.',
      defaultValue: true,
      required: true,
    }),
  },
  validate: async ({ auth, server }) => {
    try {
      await redshiftClient.runSql({ auth: { type: AppConnectionType.CUSTOM_AUTH, props: auth }, server, sql: 'SELECT 1' });
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
});

export const redshiftIamAuth = PieceAuth.OIDC({
  displayName: 'IAM Role (OIDC)',
  description: iamDescription,
  required: true,
  props: {
    roleArn: Property.ShortText({
      displayName: 'Role ARN',
      description: 'ARN of the IAM role to assume, for example arn:aws:iam::123456789012:role/MyRole.',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      description: 'The AWS region your cluster or workgroup is in.',
      required: true,
      defaultValue: 'us-east-1',
      options: { options: AWS_REGIONS },
    }),
    database: Property.ShortText({
      displayName: 'Database',
      description: 'The database to connect to. New Redshift databases are named "dev".',
      defaultValue: 'dev',
      required: true,
    }),
    workgroupName: Property.ShortText({
      displayName: 'Workgroup Name (Serverless)',
      description: 'Fill this for Redshift Serverless. Leave empty for a provisioned cluster.',
      required: false,
    }),
    clusterIdentifier: Property.ShortText({
      displayName: 'Cluster Identifier (provisioned)',
      description: 'Fill this for a provisioned cluster. Leave empty for Serverless.',
      required: false,
    }),
    dbUser: Property.ShortText({
      displayName: 'Database User (provisioned, optional)',
      description: 'Sign in to a provisioned cluster as this database user. Leave empty to sign in as the IAM role.',
      required: false,
    }),
    secretArn: Property.ShortText({
      displayName: 'Secrets Manager ARN (optional)',
      description: 'Sign in with the username and password stored in this secret instead of the IAM identity.',
      required: false,
    }),
  },
  validate: async ({ auth, server }) => {
    if (!ROLE_ARN.test(auth.roleArn.trim())) {
      return { valid: false, error: 'Invalid IAM Role ARN. Expected: arn:aws:iam::123456789012:role/RoleName' };
    }
    const hasWorkgroup = Boolean(auth.workgroupName?.trim());
    const hasCluster = Boolean(auth.clusterIdentifier?.trim());
    if (hasWorkgroup === hasCluster) {
      return { valid: false, error: 'Fill exactly one of Workgroup Name (Serverless) or Cluster Identifier (provisioned).' };
    }
    try {
      await redshiftClient.runSql({ auth: { type: AppConnectionType.OIDC, props: auth }, server, sql: 'SELECT 1' });
      return { valid: true };
    } catch (error) {
      if (isPieceServerContextError(error)) {
        throw error;
      }
      return { valid: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
});

export const redshiftAuth = [redshiftPasswordAuth, redshiftIamAuth];
