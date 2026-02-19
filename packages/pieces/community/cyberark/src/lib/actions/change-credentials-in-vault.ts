import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAuthToken } from '../common/auth-helper';
import { accountIdDropdown } from '../common/account-dropdown';

export const changeCredentialsInVault = createAction({
  auth: cyberarkAuth,
  name: 'change_credentials_in_vault',
  displayName: 'Change Credentials in the Vault',
  description:
    'Sets account credentials and changes them in the Vault. This will not affect credentials on the target device.',
  props: {
    accountId: accountIdDropdown,
    newCredentials: Property.ShortText({
      displayName: 'New Credentials',
      description:
        'The new account credentials that will be allocated to the account in the Vault. Leading and trailing white spaces will be automatically removed.',
      required: true,
    }),
  },
  async run(context) {
    const authData = await getAuthToken(context.auth);

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${authData.serverUrl}/PasswordVault/API/Accounts/${context.propsValue.accountId}/Password/Update/`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authData.token,
        },
        body: {
          NewCredentials: context.propsValue.newCredentials,
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
          error: `Failed to change credentials. Status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to change credentials',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
