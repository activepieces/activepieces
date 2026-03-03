import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAuthToken } from './auth-helper';
import { cyberarkAuth } from '../auth';

export const accountIdDropdown = Property.Dropdown({
  auth: cyberarkAuth,
  displayName: 'Account',
  description: 'Select an account from the Vault',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please authenticate first',
        options: [],
      };
    }

    try {
      const authData = await getAuthToken(auth);

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${authData.serverUrl}/PasswordVault/API/Accounts?limit=1000`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authData.token,
        },
      });

      if (response.status === 200 && response.body?.value) {
        const accounts = response.body.value;
        return {
          disabled: false,
          options: accounts.map((account: { id: string; name?: string; userName?: string; address?: string; platformId?: string; safeName?: string }) => ({
            label: `${account.userName ?? account.name ?? account.id}@${account.address ?? 'N/A'} (${account.platformId ?? 'N/A'} - ${account.safeName ?? 'N/A'})`,
            value: account.id.toString(),
          })),
        };
      } else {
        return {
          disabled: true,
          placeholder: 'Failed to load accounts',
          options: [],
        };
      }
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Error loading accounts',
        options: [],
      };
    }
  },
});
