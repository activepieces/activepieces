import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAuthToken } from '../common/auth-helper';

export const reconcileCredentialsBulk = createAction({
  auth: cyberarkAuth,
  name: 'reconcile_credentials_bulk',
  displayName: 'Reconcile Credentials in Bulk',
  description:
    'Marks multiple accounts for automatic reconciliation by the CPM',
  audience: 'both',
  aiMetadata: {
    description: 'Flags a list of CyberArk accounts (by account ID) for automatic reconciliation by the CPM, which resets the credential on both the Vault and the target device using the reconciliation account. Use to recover accounts whose stored and device credentials have diverged. Effectively idempotent: it only marks the accounts for reconciliation rather than mutating a credential per call.',
    idempotent: true,
  },
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
