import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { Mistral } from '@mistralai/mistralai';
import { mistralAuth } from '../..';

export const createEmbeddings = createAction({
  auth: mistralAuth,
  name: 'create_embeddings',
  displayName: 'Create Embeddings',
  description: 'Generate embeddings for text inputs',
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      required: true,
      description: 'The embedding model to use',
      defaultValue: 'mistral-embed',
    }),
    input: Property.LongText({
      displayName: 'Input',
      required: true,
      description: 'Text to generate embeddings for',
    }),
    encodingFormat: Property.Dropdown({
      displayName: 'Encoding Format',
      required: false,
      description: 'The format of the embeddings',
      refreshers: [],
      defaultValue: 'float',
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Float', value: 'float' },
          ],
        };
      },
    }),
  },
  async run({ auth, propsValue }) {
    const client = new Mistral({
      apiKey: auth,
    });

    const { model, input, encodingFormat } = propsValue;

    const response = await client.embeddings.create({
      model: model,
      inputs: [input],
      encodingFormat: encodingFormat,
    });

    return response;
  },
});
