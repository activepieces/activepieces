import { apolloAuth } from '../auth';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  MarkdownVariant,
  Property,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';

export const newsArticlesSearch = createAction({
  auth: apolloAuth,
  name: 'newsArticlesSearch',
  classification: 'SEARCH',
  displayName: 'News Articles Search',
  description: 'Find news about companies, such as hires and funding.',
  audience: 'both',
  aiMetadata: {
    description: 'Search the Apollo database for news articles about specific companies, filterable by news category and a published-date range. Use to surface recent events (hires, funding, contracts) for given organizations. Requires Apollo organization IDs (obtained from Organization Search). Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'companies',
      display: 'section',
      label: 'Companies',
      icon: 'users',
      props: ['organizations_info', 'organization_ids'],
    },
    {
      key: 'filters',
      display: 'section',
      label: 'Filters',
      icon: 'filter',
      props: ['categories', 'published_at_min', 'published_at_max'],
    },
  ],
  props: {
    organizations_info: Property.MarkDown({
      value: 'Get organization IDs from the **Organization Search** action.',
      variant: MarkdownVariant.INFO,
    }),
    organization_ids: Property.Array({
      displayName: 'Organization IDs',
      description: 'Apollo IDs of the companies to find news about.',
      required: true,
    }),
    categories: Property.Array({
      displayName: 'Categories',
      description:
        'News categories to include, such as hires, investment or contract.',
      required: false,
    }),
    published_at_min: Property.ShortText({
      displayName: 'Published From',
      description: 'Earliest publish date, as YYYY-MM-DD.',
      placeholder: '2026-01-01',
      width: 'half',
      required: false,
    }),
    published_at_max: Property.ShortText({
      displayName: 'Published To',
      description: 'Latest publish date, as YYYY-MM-DD.',
      placeholder: '2026-12-31',
      width: 'half',
      required: false,
    }),
    cacheResponse: Property.Checkbox({
      displayName: 'Cache Response',
      description: 'Reuse a saved result for the same input. Saved results never expire.',
      advanced: true,
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
