import { apolloAuth } from '../../';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  Property,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';

export const newsArticlesSearch = createAction({
  auth: apolloAuth,
  name: 'newsArticlesSearch',
  displayName: 'News Articles Search',
  description:
    'Search for news articles related to companies in the Apollo database',
  props: {
    organization_ids: Property.Array({
      displayName: 'Organization IDs',
      description:
        'The Apollo IDs for the companies you want to include in your search results. To find IDs, call the Organization Search endpoint.',
      required: true,
    }),
    categories: Property.Array({
      displayName: 'Categories',
      description:
        'Filter your search to include only certain categories or sub-categories of news (e.g., hires, investment, contract)',
      required: false,
    }),
    published_at_min: Property.ShortText({
      displayName: 'Published Date Min',
      description: 'Lower bound of the date range (YYYY-MM-DD format)',
      required: false,
    }),
    published_at_max: Property.ShortText({
      displayName: 'Published Date Max',
      description: 'Upper bound of the date range (YYYY-MM-DD format)',
      required: false,
    }),
    cacheResponse: Property.Checkbox({
      displayName: 'Cache Response',
      description: 'Store the response in the project store for future use.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ propsValue, auth, store }) {
    const queryParams = new URLSearchParams();

    if (propsValue.organization_ids && propsValue.organization_ids.length > 0) {
      propsValue.organization_ids.forEach((id: unknown) => {
        queryParams.append('organization_ids[]', id as string);
      });
    }

    if (propsValue.categories && propsValue.categories.length > 0) {
      propsValue.categories.forEach((category: unknown) => {
        queryParams.append('categories[]', category as string);
      });
    }

    if (propsValue.published_at_min) {
      queryParams.append('published_at[min]', propsValue.published_at_min);
    }

    if (propsValue.published_at_max) {
      queryParams.append('published_at[max]', propsValue.published_at_max);
    }

    const cacheKey = `_apollo_news_${queryParams.toString()}`;

    if (propsValue.cacheResponse) {
      const cachedResult = await store.get(cacheKey, StoreScope.PROJECT);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const result = await httpClient.sendRequest<{
      news_articles: Record<string, unknown>[];
      pagination: Record<string, unknown>;
    }>({
      method: HttpMethod.POST,
      url: `https://api.apollo.io/api/v1/news_articles/search?${queryParams.toString()}`,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': `${auth.secret_text}`,
      },
    });

    const response = {
      news_articles: result.body.news_articles || [],
      pagination: result.body.pagination || {},
    };

    if (propsValue.cacheResponse) {
      await store.put(cacheKey, response, StoreScope.PROJECT);
    }

    return response;
  },
});
