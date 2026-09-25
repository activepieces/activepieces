import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { accountPageOutputSchema } from '../output-schemas';

export const listFollowRequests = createAction({
  auth: mastodonAuth,
  name: 'list_follow_requests',
  classification: 'SEARCH',
  displayName: 'List Follow Requests',
  description: 'List pending requests to follow your account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of accounts with a pending request to follow the connected (locked) account, with Link-header cursors for further pages. Handle them with Accept Follow Request or Reject Follow Request. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: accountPageOutputSchema,
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
      path: '/api/v1/follow_requests',
      operation: 'List Follow Requests',
      scope: 'read:follows',
      query: { limit, max_id, since_id },
    });
    return { accounts: items, ...cursors };
  },
});
