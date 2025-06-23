import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const kclCompletionsAction = createAction({
  name: 'kcl_completions',
  displayName: 'KCL Code Completions',
  description: 'Get code completions for KCL (Kernel Configuration Language)',
  auth: zooAuth,
  // category: 'Machine Learning (ML)',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The KCL code prompt to get completions for',
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description: 'Controls randomness in completion generation (0.0 to 1.0)',
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      description: 'Maximum number of tokens to generate',
    }),
    stop: Property.Array({
      displayName: 'Stop Sequences',
      required: false,
      description: 'Sequences where the API will stop generating further tokens',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.zoo.dev/ml/kcl/completions',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: {
        prompt: propsValue.prompt,
        temperature: propsValue.temperature,
        max_tokens: propsValue.maxTokens,
        stop: propsValue.stop,
      },
    });
    return response.body;
  },
});
