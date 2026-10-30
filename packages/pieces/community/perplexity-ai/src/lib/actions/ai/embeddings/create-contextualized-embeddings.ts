import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';

const MODELS = ['pplx-embed-context-v1-0.6b', 'pplx-embed-context-v1-4b'];
const ENCODING_FORMATS = ['base64_int8', 'base64_binary'];

export const createContextualizedEmbeddingsAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_create_contextualized_embeddings',
  displayName: 'Create Contextualized Embeddings',
  description: 'Generate document-aware embeddings for chunks of documents.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Embeds document chunks so chunks of the same document share context, which improves retrieval over plain Create Embeddings. Input is an array of documents, each an array of chunk strings in order; returns base64-encoded vectors grouped the same way, plus token usage.',
    idempotent: true,
  },
  props: {
    input: Property.Json({
      displayName: 'Documents',
      description:
        'Array of documents, each an array of chunk strings in reading order, e.g. [["chunk 1","chunk 2"],["other doc chunk"]]. Up to 512 documents.',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description:
        '"pplx-embed-context-v1-0.6b" (1024 dimensions, cheaper) or "pplx-embed-context-v1-4b" (2560 dimensions).',
      required: true,
      defaultValue: 'pplx-embed-context-v1-0.6b',
      options: {
        disabled: false,
        options: MODELS.map((value) => ({ label: value, value })),
      },
    }),
    dimensions: Property.Number({
      displayName: 'Dimensions',
      description:
        'Output dimensions, 128 up to the model maximum (1024 or 2560). Defaults to the maximum.',
      required: false,
    }),
    encodingFormat: Property.StaticDropdown({
      displayName: 'Encoding Format',
      description:
        '"base64_int8" (default) or "base64_binary" (1 bit per dimension).',
      required: false,
      options: {
        disabled: false,
        options: ENCODING_FORMATS.map((value) => ({ label: value, value })),
      },
    }),
  },
  async run(context) {
    const p = context.propsValue;
    return await perplexityAiClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/contextualizedembeddings',
      body: {
        input: p.input,
        model: p.model,
        dimensions: p.dimensions,
        encoding_format: p.encodingFormat,
      },
    });
  },
});
