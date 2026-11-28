import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiCreateEmbeddingsOutputSchema } from '../../../output-schemas';

export const createEmbeddingsAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_create_embeddings',
  outputSchema: cometapiCreateEmbeddingsOutputSchema,
  displayName: 'Create Embeddings',
  description: 'Turns one or more texts into embedding vectors.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates OpenAI-compatible embedding vectors for a batch of texts with an embedding model such as text-embedding-3-small, one vector per input in the same order. Billed per input token.',
    idempotent: true,
  },
  props: {
    model: cometApiAiProps.model({
      required: true,
      description:
        'Embedding model ID, e.g. "text-embedding-3-small". Use List Models to find one.',
    }),
    input: Property.Array({
      displayName: 'Input',
      description: 'The texts to embed, one item per text.',
      required: true,
    }),
    dimensions: Property.Number({
      displayName: 'Dimensions',
      description:
        'Output vector size, for models that support shortening (text-embedding-3 and later).',
      required: false,
    }),
    encodingFormat: Property.StaticDropdown({
      displayName: 'Encoding Format',
      description: 'float (default) or base64.',
      required: false,
      options: {
        options: [
          { label: 'float', value: 'float' },
          { label: 'base64', value: 'base64' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/embeddings',
      body: {
        model: propsValue.model,
        input: propsValue.input,
        dimensions: propsValue.dimensions,
        encoding_format: propsValue.encodingFormat,
      },
    });
  },
});
