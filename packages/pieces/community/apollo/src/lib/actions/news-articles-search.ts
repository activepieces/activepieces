import { Property, StoreScope, createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { QueryValue, apiKeyOf, buildQuery, isRecord, recordsOf } from '../common/client';
import { apolloInputs } from '../common/ai-props';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloRequests } from '../common/requests';

export const newsArticlesSearch = createAction({
  auth: apolloAuth,
  name: 'newsArticlesSearch',
  classification: 'SEARCH',
  displayName: 'News Articles Search',
  description: 'Search for news articles related to companies in the Apollo database. Uses 1 Apollo credit per page.',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches news articles about given Apollo organization IDs, filtered by category and published-date range, one page (up to 25) at a time. Uses 1 Apollo credit per page.',
    idempotent: true,
  },
  props: {
    organization_ids: Property.Array({
      displayName: 'Organization IDs',
      description: 'The Apollo IDs for the companies you want to include in your search results. To find IDs, call the Organization Search endpoint.',
      required: true,
    }),
    categories: Property.Array({
      displayName: 'Categories',
      description: 'Filter your search to include only certain categories or sub-categories of news (e.g., hires, investment, contract)',
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
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1 (default 1). Each page uses 1 credit.',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Results per page, 1-25.',
      required: false,
    }),
    cacheResponse: Property.Checkbox({
      displayName: 'Cache Response',
      description: 'Store the response in the project store for future use.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: apolloOutputSchemas.rawNewsSearch,
  async run({ propsValue, auth, store }) {
    const query: Record<string, QueryValue> = {
      'organization_ids[]': apolloInputs.requireStringList({ value: propsValue.organization_ids, label: 'Organization IDs', max: 1000 }),
      'categories[]': apolloInputs.stringList(propsValue.categories),
      'published_at[min]': apolloInputs.optionalText(propsValue.published_at_min),
      'published_at[max]': apolloInputs.optionalText(propsValue.published_at_max),
      page: apolloInputs.optionalInteger({ value: propsValue.page, label: 'Page', min: 1, max: 500 }),
      per_page: apolloInputs.optionalInteger({ value: propsValue.per_page, label: 'Results Per Page', min: 1, max: 25 }),
    };
    const cacheKey = `_apollo_news_${buildQuery(query).slice(1)}`;
    if (propsValue.cacheResponse) {
      const cached = await store.get<unknown>(cacheKey, StoreScope.PROJECT);
      if (cached) {
        return cached;
      }
    }
    const body = await apolloRequests.searchNews({ apiKey: apiKeyOf(auth), query });
    const response = {
      news_articles: recordsOf(body['news_articles']),
      pagination: isRecord(body['pagination']) ? body['pagination'] : {},
    };
    if (propsValue.cacheResponse) {
      await store.put(cacheKey, response, StoreScope.PROJECT);
    }
    return response;
  },
});
