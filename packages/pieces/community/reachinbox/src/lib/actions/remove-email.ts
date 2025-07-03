import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { ReachinboxAuth } from '../..';
import { reachinboxCommon } from '../common';

// Define the shape of the account object
interface EmailAccount {
  id: number;
  email: string;
}

export const removeEmail = createAction({
  auth: ReachinboxAuth,
  name: 'removeEmail',
  displayName: 'Remove Email',
  description: 'Remove an email account from the system.',
  props: {
    accountId: Property.Dropdown({
      displayName: 'Select Email Account to Remove',
      description: 'Choose an email account to remove.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        try {
          // Fetch email accounts
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${reachinboxCommon.baseUrl}account/all`,
            headers: {
              Authorization: `Bearer ${auth}`,
            },
          });

          const accounts: EmailAccount[] =
            response.body?.data?.emailsConnected || [];

          // Map the fetched accounts to dropdown options
          const options = accounts.map((account: EmailAccount) => ({
            label: `${account.email} (ID: ${account.id})`,
            value: account.id.toString(),
          }));

          return {
            options,
            disabled: options.length === 0,
          };
        } catch (error) {
          console.error('Error fetching email accounts:', error);
          return { options: [], disabled: true };
        }
      },
    }),
  },
  async run(context) {
    const { accountId } = context.propsValue;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${reachinboxCommon.baseUrl}account/delete/${accountId}`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
        },
      });

      if (response.status === 200) {
        return {
          success: true,
          message: `Email account with ID ${accountId} was successfully removed.`,
        };
      } else {
        throw new Error(`Failed to remove email account with ID: ${accountId}`);
      }
    } catch (error) {
      console.error('Error removing email account:', error);
      throw new Error(`Error removing email account with ID: ${accountId}`);
    }
  },
});
