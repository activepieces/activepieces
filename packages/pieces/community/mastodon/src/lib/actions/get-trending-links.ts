import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { trendingLinksOutputSchema } from '../output-schemas';

export const getTrendingLinks = createAction({
  auth: mastodonAuth,
  name: 'get_trending_links',
  classification: 'SEARCH',
  displayName: 'Get Trending Links',
  description: 'Get news links that are trending on the server.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns links (news articles and pages) currently shared the most on the connected server, with preview card details. Servers can disable trends, in which case the list is empty. Use offset to page. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: trendingLinksOutputSchema,
  props: {
    limit: mastodonProps.limit({ noun: 'links', defaultLimit: 10, maxLimit: 20 }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of results to skip, for paging through the trend list. Defaults to 0.',
      required: false,
    }),
  },
  async run(context) {
    const { limit, offset } = context.propsValue;
    const links = await mastodonClient.request<MastodonEntity[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/trends/links',
      operation: 'Get Trending Links',
      query: { limit, offset },
    });
    return { links, count: links.length };
  },
});
