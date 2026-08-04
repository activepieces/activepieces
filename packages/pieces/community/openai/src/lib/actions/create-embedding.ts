import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

export const createEmbedding = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'create_embedding',
  displayName: 'Create Embedding',
  description:
    'Generate a vector embedding for the supplied text. Useful for semantic search, clustering and RAG pipelines.',
  aiMetadata: { description: 'Converts one block of text into a numeric embedding vector for storage in a vector database or for semantic search, clustering, and RAG pipelines. It handles a single input per call, so batch by looping or by using the custom API call action, and the dimensions option only takes effect on the text-embedding-3 models. Pick search_embeddings instead when the goal is simply ranking a list of candidate strings against a query in one step with no vector persisted. Deterministic stateless inference, so repeat calls with the same model and text return the same vector and are idempotent.', idempotent: true },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      description: 'The embedding model to use.',
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
      displayName: 'Input',
      description:
        'The text to embed. To embed multiple strings in one call, provide a newline-separated list or use the Custom API Call action.',
      required: true,
    }),
    dimensions: Property.Number({
      displayName: 'Dimensions',
      description:
        'Number of dimensions for the embedding (only supported by text-embedding-3-* models).',
      required: false,
    }),
    user: Property.ShortText({
      displayName: 'User ID',
      description: 'A stable identifier for the end user — helps OpenAI detect abuse.',
      required: false,
    }),
  },
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
