import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAuthToken } from '../common/auth-helper';

export const reconcileCredentialsBulk = createAction({
  auth: cyberarkAuth,
  name: 'reconcile_credentials_bulk',
  displayName: 'Reconcile Credentials in Bulk',
  description:
    'Marks multiple accounts for automatic reconciliation by the CPM',
  props: {
    accountIds: Property.Array({
      displayName: 'Account IDs',
      description: 'List of unique account IDs to reconcile',
      required: true,
    }),
  },
  async run(context) {
    const authData = await getAuthToken(context.auth);

    const bulkItems = (context.propsValue.accountIds as string[]).map(
      (accountId) => ({ accountId })
    );

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${authData.serverUrl}/PasswordVault/API/Accounts/Reconcile/Bulk`,
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
          error: `Failed to reconcile credentials in bulk. Status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to reconcile credentials in bulk',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
