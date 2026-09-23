import { createAction } from '@activepieces/pieces-framework';
import { googleGeminiAuth } from '../auth';
import { listAllModels } from '../common/common';
import { listModelsActionOutputSchema } from '../output-schemas';

export const listModelsAction = createAction({
  audience: 'both',
  name: 'list_models',
  classification: 'SEARCH',
  auth: googleGeminiAuth,
  displayName: 'List Models',
  description: 'Lists the Gemini and Veo models available to this API key.',
  aiMetadata: {
    description:
      'Lists every Gemini/Veo model available to this API key, with its token limits and supported generation methods. Use this to discover valid model names before calling generate_content, generate_image, create_video, or generate_embeddings, or to check a model\'s input/output token limits. Safe to retry: read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: listModelsActionOutputSchema,
  async run({ auth }) {
    const models = await listAllModels({ auth });

    return models.map((model) => ({
      name: model.name.replace('models/', ''),
      displayName: model.displayName ?? null,
      description: model.description ?? null,
      version: model.version ?? null,
      inputTokenLimit: model.inputTokenLimit ?? null,
      outputTokenLimit: model.outputTokenLimit ?? null,
      supportedGenerationMethods: Array.isArray(model.supportedGenerationMethods)
        ? model.supportedGenerationMethods.join(', ')
        : null,
    }));
  },
});
