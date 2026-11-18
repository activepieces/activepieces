import { createAction, Property } from '@activepieces/pieces-framework';
import { braveSearchAuth } from '../auth';
import { braveApi } from '../common/client';
import { SAFESEARCH_VALUES, braveProps } from '../common/props';

export const braveWebSearchAction = createAction({
  auth: braveSearchAuth,
  name: 'web_search',
  classification: 'SEARCH',
  displayName: 'Web Search',
  description: 'Search the web using Brave Search and get the full Brave response (web, news, videos and more).',
  audience: 'human',
  outputSchema: {
    fields: [
      { key: 'type', label: 'Response Type' },
      {
        key: 'query',
        label: 'Query',
        children: [
          { key: 'original', label: 'Original Query' },
          { key: 'altered', label: 'Spell-Corrected Query' },
          { key: 'more_results_available', label: 'More Results Available', format: 'boolean' },
        ],
      },
      {
        key: 'web',
        label: 'Web',
        children: [
          {
            key: 'results',
            label: 'Web Results',
            labelKey: 'title',
            listItems: [
              { key: 'title', label: 'Title' },
              { key: 'url', label: 'URL', format: 'url' },
              { key: 'description', label: 'Description' },
              { key: 'age', label: 'Age' },
              { key: 'page_age', label: 'Page Date', format: 'datetime' },
              { key: 'language', label: 'Language' },
              { key: 'extra_snippets', label: 'Extra Snippets' },
            ],
          },
        ],
      },
      { key: 'news', label: 'News', description: 'News results mixed into the web search, when Brave returns them.' },
      { key: 'videos', label: 'Videos', description: 'Video results mixed into the web search, when Brave returns them.' },
      { key: 'mixed', label: 'Mixed Ranking', description: 'How Brave ranked the different result types.' },
    ],
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The search query (at most 400 characters and 50 words).',
      placeholder: 'e.g. best open-source automation tools',
      required: true,
    }),
    count: Property.Number({
      displayName: 'Number of Results',
      description: 'How many results to return (1-20).',
      required: false,
      defaultValue: 10,
    }),
    offset: braveProps.offset(),
    country: braveProps.country(),
    search_lang: braveProps.searchLanguage(),
    safesearch: braveProps.safesearch({ defaultValue: 'moderate' }),
    freshness: braveProps.freshness(),
    freshness_range: braveProps.freshnessRange(),
    extra_snippets: braveProps.extraSnippets(),
  },
  async run(context) {
    const { query, count, offset, country, search_lang, safesearch, freshness, freshness_range, extra_snippets } = context.propsValue;
    const params = braveApi.buildQuery({
      q: braveApi.validateQuery({ query, maxChars: 400, maxWords: 50 }),
      count: braveApi.resolveInteger({ value: count, label: 'Count', min: 1, max: 20, defaultValue: 10 }),
      offset: braveApi.resolveInteger({ value: offset, label: 'Page Offset', min: 0, max: 9 }),
      country,
      search_lang,
      safesearch: braveApi.resolveChoice({ value: safesearch, allowed: SAFESEARCH_VALUES, label: 'Safe Search', defaultValue: 'moderate' }),
      freshness: braveApi.resolveFreshness({ preset: freshness, customRange: freshness_range }),
      extra_snippets: extra_snippets ? true : undefined,
    });
    return braveApi.get<unknown>({
      apiKey: context.auth.secret_text,
      path: '/web/search',
      query: params,
      operation: 'web search',
    });
  },
});
