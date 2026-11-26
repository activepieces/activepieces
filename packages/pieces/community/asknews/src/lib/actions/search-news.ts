import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { asknewsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchNews = createAction({
  auth: asknewsAuth,
  name: 'searchNews',
  classification: 'SEARCH',
  displayName: 'Search News',
  description: 'Find news articles from the last 48 hours or the archive.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches enriched news articles via the AskNews API, defaulting to recent coverage but able to query the historical archive (60+ days) instead when historical is set. The query can be keywords, a question, or a paragraph, and the search method switches between keyword, semantic natural-language, or hybrid matching; filter by category and recency. Choose this to find or retrieve current/past news on a topic. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'text',
      props: ['query', 'method', 'categories'],
    },
    {
      key: 'time',
      display: 'section',
      label: 'Time Window',
      icon: 'calendar',
      props: ['timeWindowInfo', 'hoursBack', 'historical'],
    },
    {
      key: 'results',
      display: 'section',
      label: 'Results',
      icon: 'sliders',
      props: ['nArticles', 'similarityScoreThreshold', 'returnType'],
    },
  ],
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Keywords, a question or a short paragraph.',
      placeholder: 'Electric vehicle sales in Europe',
      required: true,
    }),
    nArticles: Property.Number({
      displayName: 'Number of Articles',
      description: 'How many articles to return.',
      width: 'half',
      defaultValue: 10,
      required: false,
    }),
    method: Property.StaticDropdown({
      displayName: 'Search Method',
      description:
        'Keyword matches exact words; Natural Language matches meaning.',
      options: {
        options: [
          { label: 'Keyword', value: 'kw' },
          { label: 'Natural Language', value: 'nl' },
          { label: 'Both', value: 'both' },
        ],
      },
      defaultValue: 'kw',
      required: false,
    }),
    returnType: Property.StaticDropdown({
      displayName: 'Result Format',
      description: 'Text suits AI prompts; Structured Data suits later steps.',
      options: {
        options: [
          { label: 'Text for AI Prompts', value: 'string' },
          { label: 'Structured Data', value: 'dicts' },
          { label: 'Both', value: 'both' },
        ],
      },
      defaultValue: 'string',
      required: false,
    }),
    historical: Property.Checkbox({
      displayName: 'Search Archive',
      description: 'Search the archive instead of recent news.',
      defaultValue: false,
      required: false,
    }),
    timeWindowInfo: Property.MarkDown({
      value:
        'Recent news covers the last 48 hours. The archive goes back further.',
      variant: MarkdownVariant.INFO,
    }),
    hoursBack: Property.Number({
      displayName: 'Hours Back',
      description: 'How many hours back from now to search.',
      defaultValue: 24,
      required: false,
    }),
    categories: Property.StaticMultiSelectDropdown({
      displayName: 'Categories',
      description: 'Only return articles in these categories.',
      options: {
        options: [
          { label: 'Business', value: 'Business' },
          { label: 'Crime', value: 'Crime' },
          { label: 'Politics', value: 'Politics' },
          { label: 'Science', value: 'Science' },
          { label: 'Sports', value: 'Sports' },
          { label: 'Technology', value: 'Technology' },
          { label: 'Military', value: 'Military' },
          { label: 'Health', value: 'Health' },
          { label: 'Entertainment', value: 'Entertainment' },
          { label: 'Finance', value: 'Finance' },
          { label: 'Culture', value: 'Culture' },
          { label: 'Climate', value: 'Climate' },
          { label: 'Environment', value: 'Environment' },
          { label: 'World', value: 'World' },
        ],
      },
      required: false,
    }),
    similarityScoreThreshold: Property.Number({
      displayName: 'Minimum Similarity',
      description: 'From 0 to 1. Lower values allow looser matches.',
      width: 'half',
      defaultValue: 0.5,
      required: false,
    }),
  },
  async run(context) {
    const {
      query,
      nArticles,
      method,
      returnType,
      historical,
      hoursBack,
      categories,
      similarityScoreThreshold,
    } = context.propsValue;

    const queryParams = new URLSearchParams();
    queryParams.append('query', query);
    if (nArticles) queryParams.append('n_articles', String(nArticles));
    if (method) queryParams.append('method', method);
    if (returnType) queryParams.append('return_type', returnType);
    if (historical) queryParams.append('historical', String(historical));
    if (hoursBack) queryParams.append('hours_back', String(hoursBack));
    if (categories && categories.length > 0) {
      categories.forEach((category) =>
        queryParams.append('categories', category),
      );
    }
    if (similarityScoreThreshold)
      queryParams.append(
        'similarity_score_threshold',
        String(similarityScoreThreshold),
      );

    const queryString = queryParams.toString();
    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      `/news/search?${queryString}`,
    );

    return response;
  },
});
