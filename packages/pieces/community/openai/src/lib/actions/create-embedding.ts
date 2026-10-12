import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';
import { createEmbeddingActionOutputSchema } from '../output-schemas';

export const createEmbedding = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'create_embedding',
  classification: 'READ',
  displayName: 'Create Embedding',
  description:
    'Turn text into a vector for semantic search or clustering.',
  aiMetadata: { description: 'Converts one block of text into a numeric embedding vector for storage in a vector database or for semantic search, clustering, and RAG pipelines. It handles a single input per call, so batch by looping or by using the custom API call action, and the dimensions option only takes effect on the text-embedding-3 models. Pick search_embeddings instead when the goal is simply ranking a list of candidate strings against a query in one step with no vector persisted. Deterministic stateless inference, so repeat calls with the same model and text return the same vector and are idempotent.', idempotent: true },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      description: 'Embedding model. The default suits most uses.',
      defaultValue: 'text-embedding-3-small',
      options: {
        options: [
          { label: 'text-embedding-3-small', value: 'text-embedding-3-small' },
          { label: 'text-embedding-3-large', value: 'text-embedding-3-large' },
          { label: 'text-embedding-ada-002', value: 'text-embedding-ada-002' },
        ],
      },
    }),
    input: Property.LongText({
      displayName: 'Text',
      description: 'The text to turn into a vector.',
      required: true,
    }),
    dimensions: Property.Number({
      displayName: 'Vector Dimensions',
      description: 'Vector length. Works only with text-embedding-3 models.',
      required: false,
      advanced: true,
    }),
    user: Property.ShortText({
      displayName: 'User ID',
      description: 'Your own ID for the end user. Helps OpenAI spot abuse.',
      required: false,
      advanced: true,
    }),
  },
  outputSchema: createEmbeddingActionOutputSchema,
  async run(context) {
    const openai = new OpenAI({ apiKey: context.auth.secret_text });
    const { model, input, dimensions, user } = context.propsValue;

    const supportsDimensions = model.startsWith('text-embedding-3');

    const response = await openai.embeddings.create({
      model,
      input,
      ...(supportsDimensions && dimensions ? { dimensions } : {}),
      ...(user ? { user } : {}),
    });

    return {
      model: response.model,
      embedding: response.data[0]?.embedding ?? [],
      data: response.data,
      usage: response.usage,
    };
  },
});
