import { createAction, Property } from '@activepieces/pieces-framework';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { awsSecretsManagerAuth } from '../common/auth';
import { secretIdDropdown } from '../common/props';

export const getSecretValue = createAction({
  auth: awsSecretsManagerAuth,
  name: 'getSecretValue',
  displayName: 'Get Secret Value',
  description: 'Retrieves a secret value.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the stored value of a secret in AWS Secrets Manager, identified by name or ARN (selectable from a list or passed directly). Use when a flow needs the current credential/config held in a secret. Optionally targets a specific version ID or staging label, defaulting to the current (AWSCURRENT) version. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    secretId: secretIdDropdown,
    versionId: Property.ShortText({
      displayName: 'Version ID',
      description: 'The unique identifier of the version (optional)',
      required: false,
    }),
    versionStage: Property.ShortText({
      displayName: 'Version Stage',
      description: 'The staging label to retrieve (defaults to AWSCURRENT)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new SecretsManagerClient({
      region: auth.props.region,
      credentials: {
        accessKeyId: auth.props.accessKeyId,
        secretAccessKey: auth.props.secretAccessKey,
      },
    });

    try {
      const command = new GetSecretValueCommand({
        SecretId: propsValue.secretId,
        VersionId: propsValue.versionId,
        VersionStage: propsValue.versionStage,
      });

      const response = await client.send(command);

      return response;
    } catch (error: any) {
      throw new Error(
        `Failed to retrieve secret: ${error.message ?? 'Unknown error'}`
      );
    }
  },
});
