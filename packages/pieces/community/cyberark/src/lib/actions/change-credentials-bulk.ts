import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAuthToken } from '../common/auth-helper';

export const changeCredentialsBulk = createAction({
  auth: cyberarkAuth,
  name: 'change_credentials_bulk',
  displayName: 'Change Credentials Immediately in Bulk',
  description:
    'Marks multiple accounts for an immediate credentials change by the CPM to a new random value',
  props: {
    accountIds: Property.Array({
      displayName: 'Account IDs',
      description: 'List of unique account IDs to change credentials for',
      required: true,
    }),
    changeEntireGroup: Property.Checkbox({
      displayName: 'Change Entire Group',
      description:
        'Whether the CPM changes the credentials for all accounts in the same account group. Only applies to accounts that belong to an account group.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const authData = await getAuthToken(context.auth);

    const changeEntireGroup = context.propsValue.changeEntireGroup ?? false;
    const bulkItems = (context.propsValue.accountIds as string[]).map(
      (accountId) => ({
        accountId,
        ChangeEntireGroup: changeEntireGroup,
      })
    );

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${authData.serverUrl}/PasswordVault/API/Accounts/Change/Bulk`,
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
          error: `Failed to change credentials in bulk. Status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to change credentials in bulk',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
