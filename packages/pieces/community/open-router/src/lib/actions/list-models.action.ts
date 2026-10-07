import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { openRouterAuth } from '../auth';
import { OpenRouterModel, mapOpenRouterModelSummary } from '../common';
import { listModelsActionOutputSchema } from '../output-schemas';

const MODEL_CATEGORIES = [
  'programming',
  'roleplay',
  'marketing',
  'marketing/seo',
  'technology',
  'science',
  'translation',
  'legal',
  'finance',
  'health',
  'trivia',
  'academia',
];

export const listModelsAction = createAction({
  audience: 'both',
  name: 'list_models',
  classification: 'SEARCH',
  auth: openRouterAuth,
  displayName: 'List Models',
  description: 'Lists the models available through OpenRouter, with pricing and context limits.',
  aiMetadata: {
    description:
      'Lists every model in the OpenRouter catalog, with context length, per-token pricing, and supported parameters. Use this to discover a valid model id before calling Ask LLM or Chat Completion, or to compare pricing and context limits across providers. Optionally filter by category. Safe to retry: read-only.',
    idempotent: true,
  },
  props: {
    category: Property.StaticDropdown({
      displayName: 'Category',
      description: 'Only return models tagged for this use case.',
      required: false,
      options: {
        disabled: false,
        options: MODEL_CATEGORIES.map((category) => ({ label: category, value: category })),
      },
    }),
  },
  outputSchema: listModelsActionOutputSchema,
  async run({ auth, propsValue }) {
    const queryParams: QueryParams = {};
    if (propsValue.category) {
      queryParams['category'] = propsValue.category;
    }

    const response = await httpClient.sendRequest<{ data: OpenRouterModel[] }>({
      url: 'https://openrouter.ai/api/v1/models',
      method: HttpMethod.GET,
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    });

    return response.body.data.map(mapOpenRouterModelSummary);
  },
});
