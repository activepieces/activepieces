import { createAction, Property } from '@activepieces/pieces-framework';
import { asknewsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const generateNewsKnowledgeGraph = createAction({
  auth: asknewsAuth,
  name: 'generateNewsKnowledgeGraph',
  classification: 'SEARCH',
  displayName: 'Generate News Knowledge Graph',
  description:
    'Map the people, places and groups in matching news and how they relate.',
  audience: 'both',
  aiMetadata: {
    description:
      'Builds a news knowledge graph of disambiguated entities and their relationships from articles matching a natural-language query, via the AskNews API. Choose this when an agent needs structured entity/relationship extraction (optionally a visualization like mermaid/svg) rather than raw article text. Computes a fresh graph on each call from current matching news; safe to repeat.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'text',
      props: ['query', 'queryMethod', 'categories'],
    },
    {
      key: 'articles',
      display: 'section',
      label: 'Articles',
      icon: 'file',
      props: ['nArticles', 'hoursBack', 'historical'],
    },
    {
      key: 'graph',
      display: 'section',
      label: 'Graph',
      icon: 'sliders',
      props: [
        'minClusterProbability',
        'geoDiambiguation',
        'returnArticles',
        'visualizeWith',
      ],
    },
  ],
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'What the graph should cover, in plain words.',
      placeholder: 'Tech company acquisitions this week',
      required: true,
    }),
    returnArticles: Property.Checkbox({
      displayName: 'Include Articles',
      description: 'Add the source articles to the result.',
      defaultValue: false,
      required: false,
    }),
    minClusterProbability: Property.Number({
      displayName: 'Minimum Cluster Probability',
      description:
        'From 0 to 1. Higher values merge only near-certain entity matches.',
      defaultValue: 0.9,
      required: false,
    }),
    geoDiambiguation: Property.Checkbox({
      displayName: 'Geographic Disambiguation',
      description: 'Use locations to tell apart entities with the same name.',
      defaultValue: false,
      required: false,
    }),
    queryMethod: Property.StaticDropdown({
      displayName: 'Search Method',
      description:
        'Keyword matches exact words; Natural Language matches meaning.',
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
      description: 'How many articles to build the graph from.',
      width: 'half',
      defaultValue: 10,
      required: false,
    }),
    historical: Property.Checkbox({
      displayName: 'Search Archive',
      description: 'Search the archive instead of recent news.',
      defaultValue: false,
      required: false,
    }),
    hoursBack: Property.Number({
      displayName: 'Hours Back',
      description: 'How many hours back from now to search.',
      width: 'half',
      defaultValue: 24,
      required: false,
    }),
    categories: Property.StaticMultiSelectDropdown({
      displayName: 'Categories',
      description: 'Only use articles in these categories.',
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
      displayName: 'Visualization Format',
      description: 'Optional diagram to add to the result.',
      placeholder: 'mermaid',
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
