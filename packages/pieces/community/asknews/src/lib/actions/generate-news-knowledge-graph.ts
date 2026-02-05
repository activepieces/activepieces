import { createAction, Property } from '@activepieces/pieces-framework';
import { asknewsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const generateNewsKnowledgeGraph = createAction({
  auth: asknewsAuth,
  name: 'generateNewsKnowledgeGraph',
  displayName: 'Generate News Knowledge Graph',
  description: 'Build a custom mega-news-knowledge graph with fully disambiguated entities and relationships',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Natural language query for building the graph',
      required: true,
    }),
    returnArticles: Property.Checkbox({
      displayName: 'Return Articles',
      description: 'Include articles in the response',
      defaultValue: false,
      required: false,
    }),
    minClusterProbability: Property.Number({
      displayName: 'Min Cluster Probability',
      description: 'Minimum cluster probability for disambiguation (0-1)',
      defaultValue: 0.9,
      required: false,
    }),
    geoDiambiguation: Property.Checkbox({
      displayName: 'Geo Disambiguation',
      description: 'Use geographic disambiguation for entities',
      defaultValue: false,
      required: false,
    }),
    queryMethod: Property.StaticDropdown({
      displayName: 'Query Method',
      description: 'Search method for the query',
      defaultValue: 'kw',
      required: false,
      options: {
        options: [
          { label: 'Keyword', value: 'kw' },
          { label: 'Natural Language', value: 'nl' },
          { label: 'Both', value: 'both' },
        ],
      },
    }),
    nArticles: Property.Number({
      displayName: 'Number of Articles',
      description: 'Number of articles to use for building the graph',
      defaultValue: 10,
      required: false,
    }),
    historical: Property.Checkbox({
      displayName: 'Search Historical',
      description: 'Search historical archive instead of recent news',
      defaultValue: false,
      required: false,
    }),
    hoursBack: Property.Number({
      displayName: 'Hours Back',
      description: 'Number of hours back to search',
      defaultValue: 24,
      required: false,
    }),
    categories: Property.StaticMultiSelectDropdown({
      displayName: 'Categories',
      description: 'Filter by news categories',
      required: false,
      options: {
        options: [
          { label: 'Business', value: 'Business' },
          { label: 'Technology', value: 'Technology' },
          { label: 'Science', value: 'Science' },
          { label: 'Politics', value: 'Politics' },
          { label: 'Sports', value: 'Sports' },
          { label: 'Entertainment', value: 'Entertainment' },
          { label: 'Health', value: 'Health' },
          { label: 'Finance', value: 'Finance' },
        ],
      },
    }),
    visualizeWith: Property.ShortText({
      displayName: 'Visualize With',
      description: 'Request a visualization format (e.g., mermaid, svg)',
      required: false,
    }),
  },
  async run(context) {
    const params = context.propsValue;

    const requestBody = {
      query: params.query,
      return_articles: params.returnArticles,
      min_cluster_probability: params.minClusterProbability,
      geo_disambiguation: params.geoDiambiguation,
      filter_params: {
        method: params.queryMethod,
        n_articles: params.nArticles,
        historical: params.historical,
        hours_back: params.hoursBack,
        categories: params.categories,
      },
      visualize_with: params.visualizeWith,
    };

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/news/graph',
      requestBody
    );

    return response;
  },
});
