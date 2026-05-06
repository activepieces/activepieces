import { createAction, Property } from '@activepieces/pieces-framework';
import {
  SecretsManagerClient,
  CreateSecretCommand,
  type Tag,
} from '@aws-sdk/client-secrets-manager';
import { awsSecretsManagerAuth } from '../common/auth';

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
    const client = new SecretsManagerClient({
      region: auth.props.region,
      credentials: {
        accessKeyId: auth.props.accessKeyId,
        secretAccessKey: auth.props.secretAccessKey,
      },
    });

    try {
      const command = new CreateSecretCommand({
        Name: propsValue.name,
        SecretString: propsValue.secretValue,
        Description: propsValue.description,
        Tags: propsValue.tags?.map((tag: any) => ({
          Key: tag.key,
          Value: tag.value,
        })),
      });

      const response = await client.send(command);

      return response;
    } catch (error: any) {
      throw new Error(
        `Failed to create secret: ${error.message ?? 'Unknown error'}`
      );
    }
  },
});
