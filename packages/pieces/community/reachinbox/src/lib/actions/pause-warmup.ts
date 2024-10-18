import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { ReachinboxAuth } from '../..';
import { reachinboxCommon } from '../common';

// Define the shape of the account object
interface EmailAccount {
  id: number;
  email: string;
  warmupEnabled: boolean;
}

export const pauseWarmup = createAction({
  auth: ReachinboxAuth,
  name: 'pauseWarmup',
  displayName: 'Pause Warmup',
  description: 'Pause warmup for selected email accounts.',
  props: {
    accountId: Property.Dropdown({
      displayName: 'Select Email Accounts to Pause Warmup',
      description: 'Choose email accounts that are currently warming up.',
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

          // Filter accounts with warmupEnabled = true
          const warmupAccounts = accounts.filter(
            (account: EmailAccount) => account.warmupEnabled
          );

          // Map the warmup accounts to dropdown options
          const options = warmupAccounts.map((account: EmailAccount) => ({
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

    // Prepare the body for pausing warmup
    const body = {
      ids: [accountId],
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${reachinboxCommon.baseUrl}account/warmup/pause`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
        body,
      });

      return {
        success: true,
        message: `Warmup paused for account ID: ${accountId}`,
      };
    } catch (error) {
      console.error('Error pausing warmup:', error);
      throw new Error(`Failed to pause warmup for account ID: ${accountId}`);
    }
  },
});
