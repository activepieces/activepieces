import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { mutedAccountPageOutputSchema } from '../output-schemas';

export const listMutedAccounts = createAction({
  auth: mastodonAuth,
  name: 'list_muted_accounts',
  classification: 'SEARCH',
  displayName: 'List Muted Accounts',
  description: 'List the accounts you have muted.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of accounts muted by the connected account (each with mute_expires_at for timed mutes), with Link-header cursors for further pages. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: mutedAccountPageOutputSchema,
  props: {
    limit: mastodonProps.limit({ noun: 'accounts', defaultLimit: 40, maxLimit: 80 }),
    max_id: mastodonProps.maxId(),
    since_id: mastodonProps.sinceId(),
  },
  async run(context) {
    const { limit, max_id, since_id } = context.propsValue;
    const { items, ...cursors } = await mastodonClient.requestPage<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/mutes',
      operation: 'List Muted Accounts',
      scope: 'read:mutes',
      query: { limit, max_id, since_id },
    });
    return { accounts: items, ...cursors };
  },
});
