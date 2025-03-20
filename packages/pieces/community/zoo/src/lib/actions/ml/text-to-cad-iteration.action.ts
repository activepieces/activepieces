import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const textToCadIterationAction = createAction({
  name: 'text_to_cad_iteration',
  displayName: 'Iterate CAD Model',
  description: 'Create a new iteration of an existing 3D model',
  auth: zooAuth,
  // category: 'Machine Learning (ML)',
  props: {
    prompt: Property.ShortText({
      displayName: 'Prompt',
      required: true,
      description: 'The prompt describing desired changes',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.zoo.dev/ml/text-to-cad/iteration',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: {
        prompt: propsValue.prompt,
      },
    });
    return response.body;
  },
});
