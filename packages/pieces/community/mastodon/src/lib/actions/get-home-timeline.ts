import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { statusPageOutputSchema } from '../output-schemas';

export const getHomeTimeline = createAction({
  auth: mastodonAuth,
  name: 'get_home_timeline',
  classification: 'SEARCH',
  displayName: 'Get Home Timeline',
  description: 'Get statuses from accounts and hashtags you follow.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of the connected account\'s home timeline (posts and boosts from followed accounts and hashtags), newest first, with cursors for older or newer pages. Use Get Public Timeline for posts from everyone. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: statusPageOutputSchema,
  props: {
    limit: mastodonProps.limit({ noun: 'statuses', defaultLimit: 20, maxLimit: 40 }),
    max_id: mastodonProps.maxId(),
    since_id: mastodonProps.sinceId(),
    min_id: mastodonProps.minId(),
  },
  async run(context) {
    const { limit, max_id, since_id, min_id } = context.propsValue;
    const { items, ...cursors } = await mastodonClient.requestPage<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/timelines/home',
      operation: 'Get Home Timeline',
      scope: 'read:statuses',
      query: { limit, max_id, since_id, min_id },
    });
    return { statuses: items, ...cursors };
  },
});
