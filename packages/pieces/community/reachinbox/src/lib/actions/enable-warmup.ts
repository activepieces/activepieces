import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { ReachinboxAuth } from '../..';
import { reachinboxCommon } from '../common';

export const enableWarmup = createAction({
  auth: ReachinboxAuth,
  name: 'enableWarmup',
  classification: 'WRITE',
  displayName: 'Enable Warmup',
  description: 'Turns on warmup for a connected email account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Turns on inbox warmup for a connected ReachInbox email account, identified by its account id. Use to start gradually building sending reputation for a mailbox. Idempotent: re-running for an account already warming up leaves it enabled.',
    idempotent: true,
  },
  props: {
    accountId: Property.Dropdown({
  auth: ReachinboxAuth,
      displayName: 'Email Account',
      description: 'Only accounts with warmup turned off are listed.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        try {
          const accounts = await reachinboxCommon.fetchEmailAccounts(
            auth.secret_text
          );
          const options = accounts
            .filter((account) => !account.warmupEnabled && !account.isDisconnected)
            .map((account) => ({
              label: `${account.email} (ID: ${account.id})`,
              value: account.id.toString(),
            }));

          if (options.length === 0) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No accounts with warmup turned off.',
            };
          }
          return { options, disabled: false };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load accounts. Check your connection.',
          };
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
          Authorization: `Bearer ${context.auth.secret_text}`,
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
