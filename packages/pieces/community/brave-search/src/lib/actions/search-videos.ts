import { createAction } from '@activepieces/pieces-framework';
import { braveSearchAuth } from '../auth';
import { braveApi, braveNormalize } from '../common/client';
import { SAFESEARCH_VALUES, braveProps } from '../common/props';

export const searchVideosAction = createAction({
  auth: braveSearchAuth,
  name: 'search_videos',
  classification: 'SEARCH',
  displayName: 'Search Videos',
  description: 'Find videos with Brave Video Search.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches videos with Brave Video Search to find videos on a topic or from a creator/publisher. Returns results with title, url, description, age, duration, creator, publisher and thumbnail_url. count 1-50 (default 20), offset 0-9 pages; more_results_available says whether another page exists. Filter by freshness (pd, pw, pm, py or YYYY-MM-DDtoYYYY-MM-DD), country, search_lang and safesearch (default moderate). Read-only; one billed Brave request per call.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'more_results_available', label: 'More Results Available', format: 'boolean' },
      {
        key: 'results',
        label: 'Videos',
        labelKey: 'title',
        listItems: [
          { key: 'title', label: 'Title' },
          { key: 'url', label: 'URL', format: 'url' },
          { key: 'description', label: 'Description' },
          { key: 'age', label: 'Age' },
          { key: 'duration', label: 'Duration', description: 'As Brave formats it, e.g. "12:34".' },
          { key: 'creator', label: 'Creator' },
          { key: 'publisher', label: 'Publisher' },
          { key: 'thumbnail_url', label: 'Thumbnail', format: 'image' },
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
    safesearch: braveProps.safesearch({ defaultValue: 'moderate' }),
  },
  async run(context) {
    const { query, count, offset, country, search_lang, safesearch, freshness, freshness_range } = context.propsValue;
    const params = braveApi.buildQuery({
      q: braveApi.validateQuery({ query, maxChars: 400, maxWords: 50 }),
      count: braveApi.resolveInteger({ value: count, label: 'Number of Results', min: 1, max: 50, defaultValue: 20 }),
      offset: braveApi.resolveInteger({ value: offset, label: 'Page Offset', min: 0, max: 9 }),
      country,
      search_lang,
      safesearch: braveApi.resolveChoice({ value: safesearch, allowed: SAFESEARCH_VALUES, label: 'Safe Search', defaultValue: 'moderate' }),
      freshness: braveApi.resolveFreshness({ preset: freshness, customRange: freshness_range }),
    });
    const body = await braveApi.get<unknown>({
      apiKey: context.auth.secret_text,
      path: '/videos/search',
      query: params,
      operation: 'video search',
    });
    return braveNormalize.videos(body);
  },
});
