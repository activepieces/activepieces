import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { feedListOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyMappers } from '../common/mappers';

export const getTimeline = createAction({
  auth: blueskyAuth,
  name: 'get_timeline',
  classification: 'SEARCH',
  displayName: 'Get Home Timeline',
  description: 'List the posts in your home (Following) timeline',
  audience: 'both',
  outputSchema: feedListOutputSchema,
  aiMetadata: {
    description:
      'Lists the connected account\'s home timeline (posts and reposts from accounts it follows), newest first, with cursor pagination. Use Get User\'s Posts for one account or Search Posts for a query. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: blueskyProps.limitProperty(),
    cursor: blueskyProps.cursorProperty(),
  },
  async run({ auth, propsValue }) {
    const limit = blueskyProps.parseLimit(propsValue.limit);
    const cursor = blueskyProps.parseCursor(propsValue.cursor);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'get the timeline',
      fn: async (agent) => {
        const response = await agent.getTimeline({ limit, cursor });
        return blueskyMappers.pageOf({ items: response.data.feed.map(blueskyMappers.feedItem), cursor: response.data.cursor });
      },
    });
  },
});
