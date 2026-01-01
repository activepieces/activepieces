import { createAction, Property } from '@activepieces/pieces-framework';
import { greenptAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createEmbeddings = createAction({
  auth: greenptAuth,
  name: 'createEmbeddings',
  displayName: 'Create Embeddings',
  description:
    'Generate embeddings for text input using GreenPT models for semantic search and similarity matching',
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
