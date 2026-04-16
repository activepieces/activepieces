import { createAction, Property } from '@activepieces/pieces-framework';
import { UpdateSecretCommand } from '@aws-sdk/client-secrets-manager';
import { awsSecretsManagerAuth, createSecretsManagerClient } from '../common/auth';
import { secretIdDropdown } from '../common/props';

export const updateSecret = createAction({
  auth: awsSecretsManagerAuth,
  name: 'updateSecret',
  displayName: 'Update Secret',
  description: 'Updates an existing secret.',
  props: {
    secretId: secretIdDropdown,
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
    const client = await createSecretsManagerClient(auth.props);
    const command = new UpdateSecretCommand({
      SecretId: propsValue.secretId,
      SecretString: propsValue.secretValue,
      Description: propsValue.description,
      ClientRequestToken: propsValue.clientRequestToken,
    });
    return client.send(command);
  },
});
