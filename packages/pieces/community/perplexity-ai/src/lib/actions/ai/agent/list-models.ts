import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import type { PerplexityAiList } from '../../../common/types';

export const listModelsAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_list_models',
  displayName: 'List Models',
  description: 'List the models available to the Agent API.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the model ids (provider/model form, e.g. "openai/gpt-6-luna") that Create Agent Response accepts in Model and Models. For Orchestrator models and their prices use List Orchestrator Models.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await perplexityAiClient.request<PerplexityAiList<unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/v1/models',
    });
  },
});
