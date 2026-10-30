import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';

const MODELS = ['pplx-embed-v1-0.6b', 'pplx-embed-v1-4b'];
const ENCODING_FORMATS = ['base64_int8', 'base64_binary'];

export const createEmbeddingsAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_create_embeddings',
  displayName: 'Create Embeddings',
  description: 'Generate vector embeddings for independent texts.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Embeds up to 512 independent texts (queries, sentences, documents) and returns one base64-encoded vector per text, in input order, plus token usage. For chunks of the same document that should share context, use Create Contextualized Embeddings. Empty strings are rejected.',
    idempotent: true,
  },
  props: {
    input: Property.Array({
      displayName: 'Texts',
      description:
        'Texts to embed, up to 512, each up to 32K tokens and 120K tokens in total.',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description:
        '"pplx-embed-v1-0.6b" (1024 dimensions, cheaper) or "pplx-embed-v1-4b" (2560 dimensions).',
      required: true,
      defaultValue: 'pplx-embed-v1-0.6b',
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
      path: '/v1/embeddings',
      body: {
        input: p.input,
        model: p.model,
        dimensions: p.dimensions,
        encoding_format: p.encodingFormat,
      },
    });
  },
});
