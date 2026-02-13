import { createAction, Property } from '@activepieces/pieces-framework';
import {
  SecretsManagerClient,
  UpdateSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { awsSecretsManagerAuth } from '../common/auth';

export const updateSecretValue = createAction({
  auth: awsSecretsManagerAuth,
  name: 'updateSecretValue',
  displayName: 'Update Secret Value',
  description: 'Update a secret value in AWS Secrets Manager',
  props: {
    secretId: Property.ShortText({
      displayName: 'Secret ID or ARN',
      description: 'The name or ARN of the secret to update',
      required: true,
    }),
    secretValue: Property.LongText({
      displayName: 'Secret Value',
      description: 'The new secret value (text)',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Updated description of the secret (optional)',
      required: false,
    }),
    clientRequestToken: Property.ShortText({
      displayName: 'Client Request Token',
      description: 'A unique token to ensure idempotency (optional)',
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
      const command = new UpdateSecretCommand({
        SecretId: propsValue.secretId,
        SecretString: propsValue.secretValue,
        Description: propsValue.description,
        ClientRequestToken: propsValue.clientRequestToken,
      });

      const response = await client.send(command);

      return response;
    } catch (error: any) {
      throw new Error(
        `Failed to update secret: ${error.message ?? 'Unknown error'}`
      );
    }
  },
});
