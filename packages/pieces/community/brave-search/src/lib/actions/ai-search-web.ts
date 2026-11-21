import { createAction } from '@activepieces/pieces-framework';
import { braveSearchAuth } from '../auth';
import { braveApi, braveNormalize } from '../common/client';
import { SAFESEARCH_VALUES, braveProps } from '../common/props';

export const aiSearchWebAction = createAction({
  auth: braveSearchAuth,
  name: 'ai_search_web',
  classification: 'SEARCH',
  displayName: 'Search the Web',
  description: 'Search the web with Brave and get a compact list of results.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Runs a Brave web search for general information, facts or current topics and returns a compact list of web results (title, url, description, age, extra_snippets) plus the query Brave actually ran (spell-corrected when it changed it). Use count (1-20, default 10) and offset (0-9, pages of count) to page; more_results_available says whether another page exists. Filter with country, search_lang, safesearch and freshness (pd, pw, pm, py or YYYY-MM-DDtoYYYY-MM-DD). Returns links and short snippets only; use Get LLM Context when you need page content. Read-only; each call is one billed Brave request.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'query', label: 'Query Run', description: 'The query Brave ran, spell-corrected when it changed it.' },
      { key: 'more_results_available', label: 'More Results Available', format: 'boolean', description: 'True when a higher offset returns more results.' },
      {
        key: 'results',
        label: 'Results',
        labelKey: 'title',
        listItems: [
          { key: 'title', label: 'Title' },
          { key: 'url', label: 'URL', format: 'url' },
          { key: 'description', label: 'Description' },
          { key: 'age', label: 'Age', description: 'Human-readable age of the page, e.g. "2 days ago". Null when unknown.' },
          { key: 'extra_snippets', label: 'Extra Snippets', description: 'Up to 5 extra excerpts; empty unless Extra Snippets is on and the plan allows it.' },
        ],
      },
    ],
  },
  props: {
    query: braveProps.query({ maxChars: 400, maxWords: 50 }),
    count: braveProps.count({ min: 1, max: 20, defaultValue: 10 }),
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
      count: braveApi.resolveInteger({ value: count, label: 'Number of Results', min: 1, max: 20, defaultValue: 10 }),
      offset: braveApi.resolveInteger({ value: offset, label: 'Page Offset', min: 0, max: 9 }),
      country,
      search_lang,
      safesearch: braveApi.resolveChoice({ value: safesearch, allowed: SAFESEARCH_VALUES, label: 'Safe Search', defaultValue: 'moderate' }),
      freshness: braveApi.resolveFreshness({ preset: freshness, customRange: freshness_range }),
      result_filter: 'web,query',
      extra_snippets: extra_snippets ? true : undefined,
    });
    const body = await braveApi.get<unknown>({
      apiKey: context.auth.secret_text,
      path: '/web/search',
      query: params,
      operation: 'web search',
    });
    return braveNormalize.web(body);
  },
});
