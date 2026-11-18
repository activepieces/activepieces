import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { ReachinboxAuth } from '../..';
import { reachinboxCommon } from '../common';

export const pauseWarmup = createAction({
  auth: ReachinboxAuth,
  name: 'pauseWarmup',
  classification: 'WRITE',
  displayName: 'Pause Warmup',
  description: 'Turns off warmup for a connected email account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Turns off inbox warmup for a connected ReachInbox email account, identified by its account id. Use to stop reputation-building activity for a mailbox. Idempotent: re-running for an account already paused leaves it disabled.',
    idempotent: true,
  },
  props: {
    accountId: Property.Dropdown({
  auth: ReachinboxAuth,
      displayName: 'Email Account',
      description: 'Only accounts that are warming up are listed.',
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
            .filter((account) => account.warmupEnabled)
            .map((account) => ({
              label: `${account.email} (ID: ${account.id})`,
              value: account.id.toString(),
            }));

          if (options.length === 0) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No accounts are warming up.',
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

    // Prepare the body for pausing warmup
    const body = {
      ids: [accountId],
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${reachinboxCommon.baseUrl}account/warmup/pause`,
        headers: {
          Authorization: `Bearer ${context.auth.secret_text}`,
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
