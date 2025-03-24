import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getCadModelAction = createAction({
  name: 'get_cad_model',
  displayName: 'Get CAD Model',
  description: 'Retrieve details of a specific 3D model',
  auth: zooAuth,
  // category: 'Machine Learning (ML)',
  props: {
    modelId: Property.ShortText({
      displayName: 'Model ID',
      required: true,
      description: 'The ID of the model to retrieve',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/user/text-to-cad/${propsValue.modelId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
