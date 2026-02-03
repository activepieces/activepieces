import { createAction, Property } from '@activepieces/pieces-framework';
import { asknewsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchNews = createAction({
  auth: asknewsAuth,
  name: 'searchNews',
  displayName: 'Search News',
  description:
    'Search for enriched real-time news articles from the past 48 hours or historical archive',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Search query - can be a phrase, keyword, question, or paragraph. Leave empty to search by filters only.',
      required: true,
    }),
    nArticles: Property.Number({
      displayName: 'Number of Articles',
      description: 'Number of articles to return',
      defaultValue: 10,
      required: false,
    }),
    method: Property.StaticDropdown({
      displayName: 'Search Method',
      description:
        'Search method to use. "kw" for keyword matching, "nl" for semantic/natural language search, "both" for hybrid',
      options: {
        options: [
          { label: 'Keyword (kw)', value: 'kw' },
          { label: 'Natural Language (nl)', value: 'nl' },
          { label: 'Both (kw + nl)', value: 'both' },
        ],
      },
      defaultValue: 'kw',
      required: false,
    }),
    returnType: Property.StaticDropdown({
      displayName: 'Return Type',
      description:
        'Format of returned articles. "string" is prompt-optimized, "dicts" is structured data, "both" returns both',
      options: {
        options: [
          { label: 'String (prompt-optimized)', value: 'string' },
          { label: 'Dicts (structured)', value: 'dicts' },
          { label: 'Both', value: 'both' },
        ],
      },
      defaultValue: 'string',
      required: false,
    }),
    historical: Property.Checkbox({
      displayName: 'Search Historical Archive',
      description:
        'Search in historical archive (60+ days back) instead of just recent news (48 hours)',
      defaultValue: false,
      required: false,
    }),
    hoursBack: Property.Number({
      displayName: 'Hours Back',
      description:
        'Number of hours back to search from current time. Defaults to 24.',
      defaultValue: 24,
      required: false,
    }),
    categories: Property.StaticMultiSelectDropdown({
      displayName: 'Categories',
      description: 'Filter articles by news categories',
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
      displayName: 'Similarity Score Threshold',
      description:
        'Minimum similarity score (0-1) for results. Lower = more lenient matches.',
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

    const queryParams: any = {
      query: query,
    };
    if (nArticles) queryParams.n_articles = nArticles;
    if (method) queryParams.method = method;
    if (returnType) queryParams.return_type = returnType;
    if (historical) queryParams.historical = historical;
    if (hoursBack) queryParams.hours_back = hoursBack;
    if (categories && categories.length > 0) queryParams.categories = categories;
    if (similarityScoreThreshold)
      queryParams.similarity_score_threshold = similarityScoreThreshold;

    const queryString = new URLSearchParams(queryParams).toString();
    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      `/news/search?${queryString}`,
    );

    return response;
  },
});
