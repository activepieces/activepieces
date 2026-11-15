import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { openRouterAuth } from '../auth';
import { OpenRouterModel, mapOpenRouterModelSummary } from '../common';
import { listModelsActionOutputSchema } from '../output-schemas';

export const listEmbeddingModelsAction = createAction({
  audience: 'both',
  name: 'list_embedding_models',
  classification: 'SEARCH',
  auth: openRouterAuth,
  displayName: 'List Embedding Models',
  description: 'Lists the embedding models available through OpenRouter.',
  aiMetadata: {
    description:
      'Lists only the models in the OpenRouter catalog whose output is an embedding vector, for use as the model id in a raw call to the embeddings endpoint. Pick List Models instead when the target is a text or chat generation model. Safe to retry: read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: listModelsActionOutputSchema,
  async run({ auth }) {
    const response = await httpClient.sendRequest<{ data: OpenRouterModel[] }>({
      url: 'https://openrouter.ai/api/v1/models',
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    });

    const embeddingModels = response.body.data.filter((model) =>
      model.architecture?.output_modalities?.includes('embedding')
    );

    return embeddingModels.map(mapOpenRouterModelSummary);
  },
});
