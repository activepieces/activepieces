import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAuthToken } from '../common/auth-helper';

interface BulkItem {
  accountId: string;
  changeImmediately?: boolean;
  newCredentials?: string;
}

export const setNextPasswordBulk = createAction({
  auth: cyberarkAuth,
  name: 'set_next_password_bulk',
  displayName: 'Set Next Password in Bulk',
  description:
    'Sets multiple accounts\' credentials to use for the next CPM change',
  props: {
    bulkItems: Property.Array({
      displayName: 'Bulk Items',
      description: 'List of account items. Each item should be a JSON object with accountId (required), changeImmediately (optional), and newCredentials (optional).',
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
        url: `${authData.serverUrl}/PasswordVault/API/Accounts/SetNextPassword/Bulk`,
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
          error: `Failed to set next password in bulk. Status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to set next password in bulk',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
