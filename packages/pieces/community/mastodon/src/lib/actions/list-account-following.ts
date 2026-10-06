import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { accountPageOutputSchema } from '../output-schemas';

export const listAccountFollowing = createAction({
  auth: mastodonAuth,
  name: 'list_account_following',
  classification: 'SEARCH',
  displayName: 'List Account Following',
  description: 'List the accounts an account follows.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of accounts the given account follows, with Link-header cursors for further pages. Empty when the account hides its social graph. Use List Account Followers for the reverse direction. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: accountPageOutputSchema,
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description:
        'Local ID of the account on this server, for example 109302436954721982. Obtain it from Lookup Account, Search Accounts, Get Account or Search (use resolve for a remote user@domain).',
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
      path: `/api/v1/accounts/${encodeURIComponent(context.propsValue.account_id)}/following`,
      operation: 'List Account Following',
      scope: 'read:accounts',
      query: { limit, max_id, since_id, min_id },
    });
    return { accounts: items, ...cursors };
  },
});
