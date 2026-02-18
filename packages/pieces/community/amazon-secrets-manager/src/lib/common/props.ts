import { Property } from '@activepieces/pieces-framework';
import {
  ListSecretsCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { awsSecretsManagerAuth } from './auth';

export const secretIdDropdown = Property.Dropdown<
  string,
  true,
  typeof awsSecretsManagerAuth
>({
  auth: awsSecretsManagerAuth,
  displayName: 'Secret ID or ARN',
  description: 'The name or ARN of the secret',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect AWS account first',
      };
    }

    try {
      const client = new SecretsManagerClient({
        region: auth.props.region,
        credentials: {
          accessKeyId: auth.props.accessKeyId,
          secretAccessKey: auth.props.secretAccessKey,
        },
      });

      const options: Array<{ label: string; value: string }> = [];
      let nextToken: string | undefined;

      do {
        const response = await client.send(
          new ListSecretsCommand({ NextToken: nextToken })
        );

        options.push(
          ...(response.SecretList ?? []).map((secret) => ({
            label: secret.Name ?? secret.ARN ?? '',
            value: secret.ARN ?? secret.Name ?? '',
          }))
        );

        nextToken = response.NextToken;
      } while (nextToken);

      return {
        disabled: false,
        options,
        placeholder: 'Select a secret',
      };
    } catch (error: any) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading secrets: ${
          error.message ?? 'Unknown error'
        }`,
      };
    }
  },
});
