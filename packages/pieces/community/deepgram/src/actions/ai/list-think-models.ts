import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { thinkModelsOutputSchema } from '../../output-schemas';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from '../../common/client';
import { AGENT_BASE_URL } from '../../common/constants';

export const listThinkModelsAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_list_think_models',
  classification: 'SEARCH',
  displayName: 'List Voice Agent LLMs',
  description:
    'Lists the language models a Deepgram Voice Agent can use to think.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the LLMs (OpenAI, Anthropic, Google, Groq, Amazon Bedrock and others) that a Deepgram Voice Agent can use for its think step, each with its model ID, name and provider. Use when configuring a Deepgram Voice Agent. Read-only.',
    idempotent: true,
  },
  outputSchema: thinkModelsOutputSchema,
  props: {},
  async run(context) {
    const response = await deepgramClient.request<ThinkModelsResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/agent/settings/think/models',
      baseUrl: AGENT_BASE_URL,
      timeoutMs: DEEPGRAM_TIMEOUTS.manage,
      operation: 'list voice agent models',
    });
    const models = (response.body?.models ?? []).map((model) => ({
      id: typeof model.id === 'string' ? model.id : String(model.id ?? ''),
      name: typeof model.name === 'string' ? model.name : null,
      provider: typeof model.provider === 'string' ? model.provider : null,
    }));
    return { models, count: models.length };
  },
});

type ThinkModelsResponse = {
  models?: { id?: unknown; name?: unknown; provider?: unknown }[];
};
