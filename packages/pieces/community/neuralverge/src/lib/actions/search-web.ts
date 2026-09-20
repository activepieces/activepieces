import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const searchWebAction = createAction({
  auth: neuralvergeAuth,
  name: 'search_web',
  classification: 'SEARCH',
  displayName: 'Search the Web',
  description: 'Search the web and get ranked results with title, URL and snippet. Cost: 5 points (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Run a web search and return ranked results (title, url, snippet). Use for quick lookups; for a synthesized multi-source report use Run AI Research instead. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Search query, for example Example Inc. pricing.',
      required: true,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Two-letter country code, for example us.',
      required: false,
      defaultValue: "us",
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Two-letter language code, for example en.',
      required: false,
      defaultValue: "en",
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of results to return.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-search',
      requiredKeys: ['settings'],
      body: {
        query: propsValue.query,
        settings: {
          country: propsValue.country,
          language: propsValue.language,
          max_results: propsValue.max_results,
        },
      },
    });
  },
});
