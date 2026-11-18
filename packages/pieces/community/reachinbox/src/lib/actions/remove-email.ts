import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { ReachinboxAuth } from '../..';
import { reachinboxCommon } from '../common';

export const removeEmail = createAction({
  auth: ReachinboxAuth,
  name: 'removeEmail',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Email Account',
  description: 'Disconnects an email account from ReachInbox.',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes a connected email account from ReachInbox, identified by its account id. Use to permanently disconnect a mailbox. Idempotent on the id: once removed, repeating the call leaves the account absent.',
    idempotent: true,
  },
  props: {
    accountId: Property.Dropdown({
  auth: ReachinboxAuth,
      displayName: 'Email Account',
      description: 'The connected account to remove.',
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
            .map((account) => ({
              label: `${account.email} (ID: ${account.id})`,
              value: account.id.toString(),
            }));

          if (options.length === 0) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No connected email accounts found.',
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

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${reachinboxCommon.baseUrl}account/delete/${accountId}`,
        headers: {
          Authorization: `Bearer ${context.auth.secret_text}`,
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
