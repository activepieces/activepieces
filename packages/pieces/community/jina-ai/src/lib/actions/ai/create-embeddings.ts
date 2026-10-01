import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../../common';
import { jinaAiAuth } from '../../auth';
import { jinaAiCreateEmbeddingsOutputSchema } from '../../output-schemas';

export const createEmbeddingsAction = createAction({
  auth: jinaAiAuth,
  name: 'jina_ai_create_embeddings',
  outputSchema: jinaAiCreateEmbeddingsOutputSchema,
  displayName: 'Create Embeddings',
  description: 'Convert text into embedding vectors.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Convert one or more text strings into embedding vectors with a Jina embedding model; use it to prepare text for semantic search, clustering or similarity. Stateless compute with no side effects. For thousands of texts use Create Batch Embeddings instead, and use List Models to see available models.',
    idempotent: true,
  },
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Embedding model id, for example jina-embeddings-v5-text-small. List Models returns valid ids.',
      required: true,
      defaultValue: 'jina-embeddings-v5-text-small',
    }),
    input: Property.Array({
      displayName: 'Texts',
      description: 'The texts to embed, one per item.',
      required: true,
    }),
    task: Property.ShortText({
      displayName: 'Task',
      description: 'Task optimization, for example retrieval.query, retrieval.passage, text-matching, classification or separation.',
      required: false,
    }),
    dimensions: Property.Number({
      displayName: 'Dimensions',
      description: 'Number of dimensions of each output vector. Leave empty for the model default.',
      required: false,
    }),
  },
  async run(context) {
    const { model, input, task, dimensions } = context.propsValue;
    const texts = JinaAICommon.toStringList({ values: input, label: 'Text' });
    if (texts.length === 0) {
      throw new Error('Provide at least one text to embed.');
    }
    const response = await JinaAICommon.makeRequest({
      url: JinaAICommon.apiUrl({ path: '/embeddings' }),
      method: HttpMethod.POST,
      auth: context.auth.secret_text,
      body: {
        model,
        input: texts,
        ...(task ? { task } : {}),
        ...(typeof dimensions === 'number' ? { dimensions } : {}),
      },
    });
    return response;
  },
});
