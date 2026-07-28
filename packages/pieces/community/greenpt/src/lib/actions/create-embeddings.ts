import { createAction, Property } from '@activepieces/pieces-framework';
import { greenptAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createEmbeddings = createAction({
  audience: 'both',
  auth: greenptAuth,
  name: 'createEmbeddings',
  displayName: 'Create Embeddings',
  description:
    'Generate embeddings for text input using GreenPT models for semantic search and similarity matching',
  aiMetadata: { description: 'Converts text into embedding vectors with GreenPT\'s fixed green-embedding model, returned as floats or base64; newline-separated input is split so each non-empty line is embedded as its own vector, while single-line input embeds one string. Use for semantic search, clustering, or similarity scoring, rather than Ask GreenPT which returns generated text. Idempotent: no resource is created and the same text with the same encoding format yields the same vectors.', idempotent: true },
  props: {
    input: Property.LongText({
      displayName: 'Input Text',
      description:
        'Input text to embed. Can be a single string or multiple texts separated by newlines',
      required: true,
    }),
    encoding_format: Property.StaticDropdown({
      displayName: 'Encoding Format',
      description: 'The format to return the embeddings in',
      required: false,
      defaultValue: 'float',
      options: {
        disabled: false,
        options: [
          {
            label: 'Float',
            value: 'float',
          },
          {
            label: 'Base64',
            value: 'base64',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { input, encoding_format } = context.propsValue;

    const inputData = input.includes('\n')
      ? input.split('\n').filter((line) => line.trim().length > 0)
      : input;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/embeddings',
      {
        model: 'green-embedding',
        input: inputData,
        encoding_format: encoding_format,
      }
    );

    return response;
  },
});
