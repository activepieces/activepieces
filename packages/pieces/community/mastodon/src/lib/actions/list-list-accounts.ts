import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { accountPageOutputSchema } from '../output-schemas';

export const listListAccounts = createAction({
  auth: mastodonAuth,
  name: 'list_list_accounts',
  classification: 'SEARCH',
  displayName: 'List Accounts in List',
  description: 'List the accounts that are members of one of your lists.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of accounts in one of the connected account\'s lists, with Link-header cursors for further pages (the previous-page cursor comes back as prev_since_id). Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: accountPageOutputSchema,
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description:
        'ID of one of your lists. Obtain it from List Lists or Create List.',
      required: true,
    }),
    limit: mastodonProps.limit({ noun: 'accounts', defaultLimit: 40, maxLimit: 80 }),
    max_id: mastodonProps.maxId(),
    since_id: mastodonProps.sinceId(),
    min_id: mastodonProps.minId(),
  },
  async run(context) {
    const { limit, max_id, since_id, min_id } = context.propsValue;
    const { items, ...cursors } = await mastodonClient.requestPage<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/api/v1/lists/${encodeURIComponent(context.propsValue.list_id)}/accounts`,
      operation: 'List Accounts in List',
      scope: 'read:lists',
      query: { limit, max_id, since_id, min_id },
    });
    return { accounts: items, ...cursors };
  },
});
