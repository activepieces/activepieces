import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonClient, mastodonUtils } from '../common/client';
import { listAcknowledgementOutputSchema } from '../output-schemas';

export const removeAccountsFromList = createAction({
  auth: mastodonAuth,
  name: 'remove_accounts_from_list',
  classification: 'WRITE',
  displayName: 'Remove Accounts from List',
  description: 'Remove accounts from one of your lists.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes one or more accounts from one of the connected account\'s lists; it does not unfollow them. Removing an account that is not in the list changes nothing, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: listAcknowledgementOutputSchema,
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'ID of one of your lists. Obtain it from List Lists or Create List.',
      required: true,
    }),
    account_ids: Property.Array({
      displayName: 'Account IDs',
      description:
        'Local IDs of the accounts to remove, one per item. Obtain them from List Accounts in List.',
      required: true,
    }),
  },
  async run(context) {
    const { list_id } = context.propsValue;
    const accountIds = mastodonUtils.toStringArray(context.propsValue.account_ids);
    if (accountIds === undefined) {
      throw new Error('Provide at least one Account ID.');
    }
    await mastodonClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.DELETE,
      path: `/api/v1/lists/${encodeURIComponent(list_id)}/accounts`,
      operation: 'Remove Accounts from List',
      scope: 'write:lists',
      query: { account_ids: accountIds },
    });
    return { success: true, list_id };
  },
});
