import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { trendingStatusesOutputSchema } from '../output-schemas';

export const getTrendingStatuses = createAction({
  auth: mastodonAuth,
  name: 'get_trending_statuses',
  classification: 'SEARCH',
  displayName: 'Get Trending Statuses',
  description: 'Get statuses that are trending on the server.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns statuses currently trending on the connected server (most interacted-with). Servers can disable trends, in which case the list is empty. Use offset to page. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: trendingStatusesOutputSchema,
  props: {
    limit: mastodonProps.limit({ noun: 'statuses', defaultLimit: 20, maxLimit: 40 }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of results to skip, for paging through the trend list. Defaults to 0.',
      required: false,
    }),
  },
  async run(context) {
    const { limit, offset } = context.propsValue;
    const statuses = await mastodonClient.request<MastodonEntity[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/trends/statuses',
      operation: 'Get Trending Statuses',
      query: { limit, offset },
    });
    return { statuses, count: statuses.length };
  },
});
