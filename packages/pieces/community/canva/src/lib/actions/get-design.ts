import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';

export const canvaGetDesign = createAction({
  auth: canvaAuth,
  name: 'get_design',
  displayName: 'Get Design',
  description: 'Get details of a specific design',
  props: {
    designId: Property.ShortText({
      displayName: 'Design ID',
      description: 'ID of the design to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { designId } = context.propsValue;
    const accessToken = context.auth.access_token;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.canva.com/rest/v1/designs/${designId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.body;
  },
});
