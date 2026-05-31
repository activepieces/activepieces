import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { voxellForgeAuth } from '../auth';

type ForgeEmbeddingResponse = {
  embeddings: number[][];
  dim: number;
  model: string;
  tokens: number;
  usage?: {
    total_tokens?: number;
  };
  latency_ms?: number;
};

export const createEmbeddings = createAction({
  auth: voxellForgeAuth,
  name: 'create_embeddings',
  displayName: 'Create Embeddings',
  description: 'Create vector embeddings for one or more text inputs using Voxell Forge.',
  props: {
    texts: Property.Array({
      displayName: 'Texts',
      description: 'One or more text inputs to embed.',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Forge embedding model tier.',
      required: true,
      defaultValue: 'turbo',
      options: {
        disabled: false,
        options: [
          { label: 'Turbo - 1024 dimensions', value: 'turbo' },
          { label: 'Pro - 2560 dimensions', value: 'pro' },
          { label: 'Ultra 4K - 4096 dimensions', value: 'ultra-4k' },
        ],
      },
    }),
    dim: Property.Number({
      displayName: 'Dimensions',
      description:
        "Optional Matryoshka truncation dimension. Leave blank to use the model's native dimension.",
      required: false,
    }),
    inputType: Property.StaticDropdown({
      displayName: 'Input Type',
      description: 'Use query for search queries and document for content being indexed.',
      required: false,
      defaultValue: 'document',
      options: {
        disabled: false,
        options: [
          { label: 'Document', value: 'document' },
          { label: 'Query', value: 'query' },
        ],
      },
    }),
  },
  async run(context) {
    const texts = (context.propsValue.texts as unknown[])
      .map((text) => String(text ?? ''))
      .filter((text) => text.trim().length > 0);

    if (texts.length === 0) {
      throw new Error('Provide at least one non-empty text input.');
    }

    const body: Record<string, unknown> = {
      texts,
      model: context.propsValue.model,
    };

    if (context.propsValue.dim !== undefined && context.propsValue.dim !== null) {
      body['dim'] = context.propsValue.dim;
    }

    if (context.propsValue.inputType) {
      body['input_type'] = context.propsValue.inputType;
    }

    const response = await httpClient.sendRequest<ForgeEmbeddingResponse>({
      method: HttpMethod.POST,
      url: 'https://api.voxell.ai/v1/embed',
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
