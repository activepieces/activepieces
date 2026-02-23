import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAuthToken } from '../common/auth-helper';

interface BulkItem {
  accountId: string;
  newCredentials?: string;
}

export const changeCredentialsInVaultBulk = createAction({
  auth: cyberarkAuth,
  name: 'change_credentials_in_vault_bulk',
  displayName: 'Change Credentials in the Vault in Bulk',
  description:
    'Sets credentials for multiple accounts and changes them in the Vault. This does not affect credentials on the target device.',
  props: {
    bulkItems: Property.Array({
      displayName: 'Bulk Items',
      description:
        'List of account items. Each item should be a JSON object with accountId (required) and newCredentials (optional).',
      required: true,
    }),
  },
  async run(context) {
    const authData = await getAuthToken(context.auth);

    const bulkItems: BulkItem[] = (context.propsValue.bulkItems as unknown[]).map((item) => {
      if (typeof item === 'string') {
        return JSON.parse(item) as BulkItem;
      }
      return item as BulkItem;
    });

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${authData.serverUrl}/PasswordVault/API/Accounts/Password/Update/Bulk`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authData.token,
        },
        body: {
          bulkItems,
        },
      });

      if (response.status === 200) {
        return {
          success: true,
          details: response.body,
        };
      } else {
        return {
          success: false,
          error: `Failed to change credentials in vault in bulk. Status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to change credentials in vault in bulk',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
