import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonClient, mastodonUtils } from '../common/client';
import { listAcknowledgementOutputSchema } from '../output-schemas';

export const addAccountsToList = createAction({
  auth: mastodonAuth,
  name: 'add_accounts_to_list',
  classification: 'WRITE',
  displayName: 'Add Accounts to List',
  description: 'Add accounts you follow to one of your lists.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one or more accounts to one of the connected account\'s lists. The connected account must already follow each of them (use Follow Account first), otherwise Mastodon rejects the call. Adding an account that is already in the list may be rejected, so check List Accounts in List before retrying.',
    idempotent: false,
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
        'Local IDs of followed accounts to add, one per item. Obtain them from List Account Following, Lookup Account or Search Accounts.',
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
      method: HttpMethod.POST,
      path: `/api/v1/lists/${encodeURIComponent(list_id)}/accounts`,
      operation: 'Add Accounts to List',
      scope: 'write:lists',
      body: { account_ids: accountIds },
    });
    return { success: true, list_id };
  },
});
