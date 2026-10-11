import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../../common';
import { jinaAiAuth } from '../../auth';
import { jinaAiListModelsOutputSchema } from '../../output-schemas';

export const listModelsAction = createAction({
  auth: jinaAiAuth,
  name: 'jina_ai_list_models',
  outputSchema: jinaAiListModelsOutputSchema,
  displayName: 'List Models',
  description: 'List available Jina models.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'List the models available on the Jina API with ids, context lengths and pricing; use it to find a valid model id for embeddings, reranking or batch jobs.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await JinaAICommon.makeRequest({
      url: JinaAICommon.apiUrl({ path: '/models' }),
      method: HttpMethod.GET,
      auth: context.auth.secret_text,
    });
    const models = Array.isArray(response?.data) ? response.data : [];
    return { models, count: models.length };
  },
});
