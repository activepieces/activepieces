import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { ReachinboxAuth } from '../..';
import { reachinboxCommon } from '../common';

// Define the shape of the account object
interface EmailAccount {
  id: number;
  email: string;
  warmupEnabled: boolean;
  isDisconnected: boolean;
}

export const enableWarmup = createAction({
  auth: ReachinboxAuth,
  name: 'enableWarmup',
  displayName: 'Enable Warmup',
  description:
    'Enable warmup for specific email accounts where it is currently disabled.',
  props: {
    accountId: Property.Dropdown({
      displayName: 'Select Email Accounts to Enable Warmup',
      description: 'Choose email accounts that have warmup disabled.',
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

          // Filter accounts where warmup is not enabled and isDisconnected is false
          const accountsToEnableWarmup = accounts.filter(
            (account: EmailAccount) =>
              !account.warmupEnabled && !account.isDisconnected
          );

          // Map the filtered accounts to dropdown options
          const options = accountsToEnableWarmup.map(
            (account: EmailAccount) => ({
              label: `${account.email} (ID: ${account.id})`,
              value: account.id.toString(),
            })
          );

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

    // Prepare the body for enabling warmup
    const body = {
      ids: [accountId],
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${reachinboxCommon.baseUrl}account/warmup/enable`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
        body,
      });

      return {
        success: true,
        message: `Warmup enabled for account ID: ${accountId}`,
      };
    } catch (error) {
      console.error('Error enabling warmup:', error);
      throw new Error(`Failed to enable warmup for account ID: ${accountId}`);
    }
  },
});
