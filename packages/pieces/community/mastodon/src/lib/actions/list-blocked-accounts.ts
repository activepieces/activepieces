import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { accountPageOutputSchema } from '../output-schemas';

export const listBlockedAccounts = createAction({
  auth: mastodonAuth,
  name: 'list_blocked_accounts',
  classification: 'SEARCH',
  displayName: 'List Blocked Accounts',
  description: 'List the accounts you have blocked.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of accounts blocked by the connected account, with Link-header cursors for further pages. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: accountPageOutputSchema,
  props: {
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
      path: '/api/v1/blocks',
      operation: 'List Blocked Accounts',
      scope: 'read:blocks',
      query: { limit, max_id, since_id, min_id },
    });
    return { accounts: items, ...cursors };
  },
});
