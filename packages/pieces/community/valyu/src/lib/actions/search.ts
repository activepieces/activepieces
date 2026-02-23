import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { valyuAuth } from '../../index';

export const searchAction = createAction({
  name: 'search',
  displayName: 'Search',
  description: 'Search the web, research papers, and proprietary datasets to retrieve relevant context.',
  auth: valyuAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The search query to find relevant content.',
      required: true,
    }),
    max_num_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of results to return (1-20 for standard API keys, up to 100 with special API key).',
      required: false,
      defaultValue: 10,
    }),
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: "Type of search to perform. 'web' searches web content. 'proprietary' uses Valyu's full-text multimodal indices. 'news' returns only news articles.",
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Web', value: 'web' },
          { label: 'Proprietary', value: 'proprietary' },
          { label: 'News', value: 'news' },
        ],
      },
    }),
    fast_mode: Property.Checkbox({
      displayName: 'Fast Mode',
      description: 'Enable fast mode for reduced latency but shorter results. Best for general purpose queries.',
      required: false,
      defaultValue: false,
    }),
    max_price: Property.Number({
      displayName: 'Max Price (CPM)',
      description: 'Maximum price in dollars for a thousand retrievals (CPM). Only applies when provided.',
      required: false,
    }),
    relevance_threshold: Property.Number({
      displayName: 'Relevance Threshold',
      description: 'Minimum relevance score for results (0.0-1.0).',
      required: false,
      defaultValue: 0.5,
    }),
    included_sources: Property.Array({
      displayName: 'Included Sources',
      description: 'Specific sources to search (URLs, domains or dataset names).',
      required: false,
    }),
    excluded_sources: Property.Array({
      displayName: 'Excluded Sources',
      description: 'Specific sources to exclude from search (URLs, domains, or dataset names).',
      required: false,
    }),
    category: Property.ShortText({
      displayName: 'Category',
      description: 'Natural language category/guide phrase to help guide the search (e.g., "agentic use-cases").',
      required: false,
    }),
    response_length: Property.StaticDropdown({
      displayName: 'Response Length',
      description: 'Controls the length of content returned per result.',
      required: false,
      defaultValue: 'short',
      options: {
        options: [
          { label: 'Short (25k chars)', value: 'short' },
          { label: 'Medium (50k chars)', value: 'medium' },
          { label: 'Large (100k chars)', value: 'large' },
          { label: 'Max (full content)', value: 'max' },
        ],
      },
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: '2-letter ISO country code to bias search results (e.g., US, GB, DE).',
      required: false,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date for time-filtered searches (YYYY-MM-DD).',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'End date for time-filtered searches (YYYY-MM-DD).',
      required: false,
    }),
    url_only: Property.Checkbox({
      displayName: 'URL Only',
      description: 'When set to true, only returns URLs for results (no content). Only applies when search_type is web or news.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth;

    const body: Record<string, unknown> = {
      query: context.propsValue.query,
    };

    const optionalProps = [
      'max_num_results',
      'search_type',
      'fast_mode',
      'max_price',
      'relevance_threshold',
      'included_sources',
      'excluded_sources',
      'category',
      'response_length',
      'country_code',
      'start_date',
      'end_date',
      'url_only',
    ];

    for (const prop of optionalProps) {
      const val = context.propsValue[prop as keyof typeof context.propsValue];
      if (val !== undefined && val !== null && val !== '') {
        body[prop] = val;
      }
    }

    const response = await makeRequest(apiKey.secret_text, HttpMethod.POST, '/v1/search', body);
    return response;
  },
});
