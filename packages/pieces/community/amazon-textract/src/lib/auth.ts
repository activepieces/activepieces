import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { GetDocumentAnalysisCommand } from '@aws-sdk/client-textract';
import { createTextractClient } from './common';

export const amazonTextractAuth = PieceAuth.CustomAuth({
  description:
    'Authenticate with AWS using your Access Key ID and Secret Access Key. The IAM user or role must have permissions for AWS Textract (e.g., the `AmazonTextractFullAccess` managed policy).',
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
        ],
      },
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
      const client = await createTextractClient(auth);
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
