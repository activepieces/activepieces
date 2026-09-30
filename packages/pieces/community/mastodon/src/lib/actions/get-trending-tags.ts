import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { trendingTagsOutputSchema } from '../output-schemas';

export const getTrendingTags = createAction({
  auth: mastodonAuth,
  name: 'get_trending_tags',
  classification: 'SEARCH',
  displayName: 'Get Trending Hashtags',
  description: 'Get hashtags that are trending on the server.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns hashtags currently trending on the connected server, with usage history. Servers can disable trends, in which case the list is empty. Use offset to page. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: trendingTagsOutputSchema,
  props: {
    limit: mastodonProps.limit({ noun: 'hashtags', defaultLimit: 10, maxLimit: 20 }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of results to skip, for paging through the trend list. Defaults to 0.',
      required: false,
    }),
  },
  async run(context) {
    const { limit, offset } = context.propsValue;
    const tags = await mastodonClient.request<MastodonEntity[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/trends/tags',
      operation: 'Get Trending Hashtags',
      query: { limit, offset },
    });
    return { tags, count: tags.length };
  },
});
