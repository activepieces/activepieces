import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { openRouterAuth } from '../auth';
import { OpenRouterModel, mapOpenRouterModelSummary } from '../common';
import { listModelsActionOutputSchema } from '../output-schemas';

export const listUserModelsAction = createAction({
  audience: 'both',
  name: 'list_user_models',
  classification: 'SEARCH',
  auth: openRouterAuth,
  displayName: 'List My Available Models',
  description: "Lists the models your account can actually use once your provider preferences, privacy settings, and guardrails are applied.",
  aiMetadata: {
    description:
      "Lists the OpenRouter models this account can actually use once its provider preferences, privacy settings, and guardrails are applied - narrower than List Models when the account has restrictions configured. Use it to confirm a model is reachable before calling it. Safe to retry: read-only.",
    idempotent: true,
  },
  props: {},
  outputSchema: listModelsActionOutputSchema,
  async run({ auth }) {
    const response = await httpClient.sendRequest<{ data: OpenRouterModel[] }>({
      url: 'https://openrouter.ai/api/v1/models/user',
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    });

    return response.body.data.map(mapOpenRouterModelSummary);
  },
});
