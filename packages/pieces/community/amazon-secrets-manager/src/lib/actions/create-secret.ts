import { createAction, Property } from '@activepieces/pieces-framework';
import { CreateSecretCommand } from '@aws-sdk/client-secrets-manager';
import { awsSecretsManagerAuth, createSecretsManagerClient } from '../common/auth';

export const createSecret = createAction({
  auth: awsSecretsManagerAuth,
  name: 'createSecret',
  displayName: 'Create Secret',
  description: 'Creates a new secret.',
  props: {
    name: Property.ShortText({
      displayName: 'Secret Name',
      description: 'The name of the secret',
      required: true,
    }),
    secretValue: Property.LongText({
      displayName: 'Secret Value',
      description: 'The secret value (text)',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description of the secret (optional)',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags',
      required: false,
      properties: {
        key: Property.ShortText({
          displayName: 'Tag Key',
          description: 'The key of the tag',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Tag Value',
          description: 'The value of the tag',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const client = await createSecretsManagerClient(auth.props);
    const command = new CreateSecretCommand({
      Name: propsValue.name,
      SecretString: propsValue.secretValue,
      Description: propsValue.description,
      Tags: (propsValue.tags as Array<{ key: string; value: string }>)?.map((tag) => ({
        Key: tag.key,
        Value: tag.value,
      })),
    });
    return client.send(command);
  },
});
