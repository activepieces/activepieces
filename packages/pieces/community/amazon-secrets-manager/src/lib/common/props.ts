import { Property } from '@activepieces/pieces-framework';
import {
  ListSecretsCommand,
} from '@aws-sdk/client-secrets-manager';
import { awsSecretsManagerCombinedAuth } from './auth';
import { resolveSecretsManagerClient } from './client';

export const secretIdDropdown = Property.Dropdown<
  string,
  true,
  typeof awsSecretsManagerCombinedAuth
>({
  auth: awsSecretsManagerCombinedAuth,
  displayName: 'Secret ID or ARN',
  description: 'The name or ARN of the secret',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }, { server }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect AWS account first',
      };
    }

    try {
      const client = await resolveSecretsManagerClient({ auth: auth.props, server });

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
