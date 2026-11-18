import { createAction } from '@activepieces/pieces-framework';
import { braveSearchAuth } from '../auth';
import { braveApi, braveNormalize } from '../common/client';
import { SAFESEARCH_VALUES, braveProps } from '../common/props';

export const searchNewsAction = createAction({
  auth: braveSearchAuth,
  name: 'search_news',
  classification: 'SEARCH',
  displayName: 'Search News',
  description: 'Find recent news articles with Brave News Search.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches news articles with Brave News Search. Use it for recent news, breaking updates, current events or headlines about a topic, company or person. Returns results with title, url, description, age, page_age, source hostname, breaking flag, thumbnail_url and extra_snippets. count 1-50 (default 20), offset 0-9 pages; more_results_available says whether another page exists. Filter by freshness (pd, pw, pm, py or YYYY-MM-DDtoYYYY-MM-DD), country, search_lang and safesearch (default strict). Cite the result url when you relay a story. Read-only; one billed Brave request per call.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'more_results_available', label: 'More Results Available', format: 'boolean' },
      {
        key: 'results',
        label: 'Articles',
        labelKey: 'title',
        listItems: [
          { key: 'title', label: 'Title' },
          { key: 'url', label: 'URL', format: 'url' },
          { key: 'description', label: 'Description' },
          { key: 'age', label: 'Age', description: 'Human-readable age, e.g. "3 hours ago".' },
          { key: 'page_age', label: 'Published', format: 'datetime' },
          { key: 'source', label: 'Source', description: 'Hostname of the publisher.' },
          { key: 'breaking', label: 'Breaking', format: 'boolean' },
          { key: 'thumbnail_url', label: 'Thumbnail', format: 'image' },
          { key: 'extra_snippets', label: 'Extra Snippets' },
        ],
      },
    ],
  },
  props: {
    query: braveProps.query({ maxChars: 400, maxWords: 50 }),
    count: braveProps.count({ min: 1, max: 50, defaultValue: 20 }),
    offset: braveProps.offset(),
    freshness: braveProps.freshness(),
    freshness_range: braveProps.freshnessRange(),
    country: braveProps.country(),
    search_lang: braveProps.searchLanguage(),
    safesearch: braveProps.safesearch({ defaultValue: 'strict' }),
    extra_snippets: braveProps.extraSnippets(),
  },
  async run(context) {
    const { query, count, offset, country, search_lang, safesearch, freshness, freshness_range, extra_snippets } = context.propsValue;
    const params = braveApi.buildQuery({
      q: braveApi.validateQuery({ query, maxChars: 400, maxWords: 50 }),
      count: braveApi.resolveInteger({ value: count, label: 'Number of Results', min: 1, max: 50, defaultValue: 20 }),
      offset: braveApi.resolveInteger({ value: offset, label: 'Page Offset', min: 0, max: 9 }),
      country,
      search_lang,
      safesearch: braveApi.resolveChoice({ value: safesearch, allowed: SAFESEARCH_VALUES, label: 'Safe Search', defaultValue: 'strict' }),
      freshness: braveApi.resolveFreshness({ preset: freshness, customRange: freshness_range }),
      extra_snippets: extra_snippets ? true : undefined,
    });
    const body = await braveApi.get<unknown>({
      apiKey: context.auth.secret_text,
      path: '/news/search',
      query: params,
      operation: 'news search',
    });
    return braveNormalize.news(body);
  },
});
