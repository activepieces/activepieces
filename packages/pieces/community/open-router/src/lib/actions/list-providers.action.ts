import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { openRouterAuth } from '../auth';
import { OpenRouterProvider } from '../common';
import { listProvidersActionOutputSchema } from '../output-schemas';

export const listProvidersAction = createAction({
  audience: 'both',
  name: 'list_providers',
  classification: 'SEARCH',
  auth: openRouterAuth,
  displayName: 'List Providers',
  description: 'Lists the upstream AI model providers routed through OpenRouter.',
  aiMetadata: {
    description:
      'Lists every upstream provider OpenRouter can route requests to (e.g. Azure, CoreWeave, Cerebras), with headquarters and policy links. Use it to see which providers exist before restricting a model to specific providers with provider routing options. Safe to retry: read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: listProvidersActionOutputSchema,
  async run({ auth }) {
    const response = await httpClient.sendRequest<{ data: OpenRouterProvider[] }>({
      url: 'https://openrouter.ai/api/v1/providers',
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    });

    return response.body.data;
  },
});
