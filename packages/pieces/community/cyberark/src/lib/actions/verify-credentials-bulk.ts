import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAuthToken } from '../common/auth-helper';

export const verifyCredentialsBulk = createAction({
  auth: cyberarkAuth,
  name: 'verify_credentials_bulk',
  displayName: 'Verify Credentials in Bulk',
  description:
    'Marks multiple accounts for verification by the CPM',
  audience: 'both',
  aiMetadata: {
    description: 'Flags a list of CyberArk accounts (by account ID) for credential verification by the CPM, which checks that the stored credential still matches the target device. Use to trigger a verification sweep across many accounts at once. Effectively idempotent: it only marks the accounts for verification rather than mutating any credential.',
    idempotent: true,
  },
  props: {
    accountIds: Property.Array({
      displayName: 'Account IDs',
      description: 'List of unique account IDs to verify',
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
        url: `${authData.serverUrl}/PasswordVault/API/Accounts/Verify/Bulk`,
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
          error: `Failed to verify credentials in bulk. Status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to verify credentials in bulk',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
