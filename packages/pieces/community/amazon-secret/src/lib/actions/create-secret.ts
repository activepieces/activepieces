import { createAction, Property } from '@activepieces/pieces-framework';
import {
  SecretsManagerClient,
  CreateSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { awsSecretsManagerAuth } from '../common/auth';

export const createSecret = createAction({
  auth: awsSecretsManagerAuth,
  name: 'createSecret',
  displayName: 'Create Secret',
  description: 'Create a new secret in AWS Secrets Manager',
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
    tags: Property.ShortText({
      displayName: 'Tags (JSON)',
      description: 'Tags as JSON object, e.g. {"key1":"value1","key2":"value2"} (optional)',
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
      let tags: { Key: string; Value: string }[] | undefined;
      if (propsValue.tags) {
        try {
          const tagObj = JSON.parse(propsValue.tags);
          tags = Object.entries(tagObj).map(([key, value]) => ({
            Key: key,
            Value: String(value),
          }));
        } catch (e) {
          throw new Error('Invalid tags JSON format');
        }
      }

      const command = new CreateSecretCommand({
        Name: propsValue.name,
        SecretString: propsValue.secretValue,
        Description: propsValue.description,
        Tags: tags,
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
