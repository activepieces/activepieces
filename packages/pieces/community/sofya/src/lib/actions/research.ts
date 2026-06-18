import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sofyaAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const researchAction = createAction({
  name: 'research',
  displayName: 'Deep Research',
  description: 'Research any topic — searches up to 30 sources and synthesizes a cited report.',
  audience: 'both',
  aiMetadata: {
    description:
      'Perform comprehensive research on a topic: Sofya decomposes the query into sub-queries, searches and reads multiple sources in parallel, then synthesizes a structured report with citations. Best for open-ended or comparative questions that need coverage from many angles; for simple lookups use Search instead. Costs 25 credits. Not idempotent: it selects sources and synthesizes a report at request time, so repeated calls with the same query can differ.',
    idempotent: false,
  },
  auth: sofyaAuth,
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'The research question or topic.',
      required: true,
    }),
    topic: Property.StaticDropdown({
      displayName: 'Topic',
      description: 'Use "news" to prioritize recent news articles.',
      required: false,
      defaultValue: 'general',
      options: {
        options: [
          { label: 'General', value: 'general' },
          { label: 'News', value: 'news' },
        ],
      },
    }),
    max_sources: Property.Number({
      displayName: 'Maximum Sources',
      description: 'Maximum number of sources to use (5-30).',
      required: false,
      defaultValue: 20,
    }),
    freshness: Property.ShortText({
      displayName: 'Freshness',
      description: 'Filter by recency: "day", "week", "month", "year", or a range "YYYY-MM-DD:YYYY-MM-DD".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      query: propsValue.query,
      topic: propsValue.topic,
      max_sources: propsValue.max_sources,
    };
    if (propsValue.freshness) {
      body['freshness'] = propsValue.freshness;
    }

    return await makeRequest({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: '/research',
      body,
    });
  },
});
