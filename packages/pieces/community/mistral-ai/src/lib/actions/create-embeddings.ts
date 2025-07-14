import { createAction, Property } from '@activepieces/pieces-framework';
import { mistralAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { modelIdDropdown } from '../common/props';

export const createEmbeddings = createAction({
  auth: mistralAiAuth,
  name: 'createEmbeddings',
  displayName: 'Create Embeddings',
  description: 'Create text embeddings for semantic search, similarity matching, etc.',
  props: {
    model: modelIdDropdown,
    // model: Property.ShortText({
    //   displayName: "Model",
    //   required: true
    // }),
    input: Property.Array({
      displayName: 'Input',
      description: 'The input text(s) to embed. Can be a string or array of strings.',
      required: true,
      defaultValue: ['Embed this sentence.'],
    }),
    output_dimension: Property.Number({
      displayName: 'Output Dimension',
      description: 'The dimension of the output embeddings. If not specified, the default dimension for the model will be used.',
      required: false,
    }),
    output_dtype: Property.StaticDropdown({
      displayName: 'Output Data Type',
      description: 'The data type of the output embeddings',
      required: false,
      defaultValue: 'float',
      options: {
        options: [
          { label: 'Float', value: 'float' },
          { label: 'ubinary', value: 'ubinary' },
          { label: 'int8', value: 'int8' },
          { label: 'uint8', value: 'uint8' },
          { label: 'binary', value: 'binary' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const {
      model,
      input,
      output_dimension,
      output_dtype,
    } = propsValue;

    const requestBody: any = {
      model,
      input,
    };

    // Add optional parameters only if they are provided
    if (output_dimension !== undefined) requestBody.output_dimension = output_dimension;
    if (output_dtype !== undefined) requestBody.output_dtype = output_dtype;

    const response = await makeRequest(auth as string, HttpMethod.POST, '/embeddings', requestBody);

    return response;
  },
});
