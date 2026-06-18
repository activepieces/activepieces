import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sofyaAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const searchAction = createAction({
  name: 'search',
  displayName: 'Search the Web',
  description: 'Search the web and get full page content, not just snippets.',
  audience: 'both',
  aiMetadata: {
    description:
      'Run a web search through Sofya for a natural-language query and return extracted page content (not just snippets), optionally with an AI-synthesized answer. Narrow scope with a general vs. news topic, a recency window, result count, and domain include/exclude lists. Use to look up current or external information from the web. Read-only and idempotent: the same query returns equivalent results, though live web data may shift over time.',
    idempotent: true,
  },
  auth: sofyaAuth,
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'The search query.',
      required: true,
    }),
    search_depth: Property.StaticDropdown({
      displayName: 'Search Depth',
      description:
        '"basic" fetches pages and returns extracted content (3 credits). "snippets" returns SERP snippets only, without fetching pages (1 credit).',
      required: false,
      defaultValue: 'basic',
      options: {
        options: [
          { label: 'Basic', value: 'basic' },
          { label: 'Snippets', value: 'snippets' },
        ],
      },
    }),
    topic: Property.StaticDropdown({
      displayName: 'Topic',
      description: 'Use "news" for current events, breaking news, or any time-sensitive query.',
      required: false,
      defaultValue: 'general',
      options: {
        options: [
          { label: 'General', value: 'general' },
          { label: 'News', value: 'news' },
        ],
      },
    }),
    max_results: Property.Number({
      displayName: 'Maximum Results',
      description: 'Number of results to return (1-20).',
      required: false,
      defaultValue: 10,
    }),
    include_answer: Property.Checkbox({
      displayName: 'Include Answer',
      description: 'Add an AI-synthesized answer based on the search results (adds 5 credits).',
      required: false,
      defaultValue: false,
    }),
    freshness: Property.ShortText({
      displayName: 'Freshness',
      description: 'Filter by recency: "day", "week", "month", "year", or a range "YYYY-MM-DD:YYYY-MM-DD".',
      required: false,
    }),
    include_domains: Property.Array({
      displayName: 'Include Domains',
      description: 'Only include results from these domains (max 10).',
      required: false,
    }),
    exclude_domains: Property.Array({
      displayName: 'Exclude Domains',
      description: 'Exclude results from these domains (max 10).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      query: propsValue.query,
      search_depth: propsValue.search_depth,
      topic: propsValue.topic,
      max_results: propsValue.max_results,
      include_answer: propsValue.include_answer,
    };
    if (propsValue.freshness) {
      body['freshness'] = propsValue.freshness;
    }
    if (propsValue.include_domains && propsValue.include_domains.length > 0) {
      body['include_domains'] = propsValue.include_domains;
    }
    if (propsValue.exclude_domains && propsValue.exclude_domains.length > 0) {
      body['exclude_domains'] = propsValue.exclude_domains;
    }

    return await makeRequest({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: '/search',
      body,
    });
  },
});
