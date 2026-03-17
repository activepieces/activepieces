import { createAction, Property } from '@activepieces/pieces-framework';
import { renderAuth } from '../render';

export const getDeploy = createAction({
  name: 'get_deploy',
  displayName: 'Get Deploy',
  description: 'Get details for a specific deploy',
  auth: renderAuth,
  props: {
    serviceId: Property.ShortText({
      displayName: 'Service ID',
      description: 'The ID of the service (e.g. srv-xxxxx)',
      required: true,
    }),
    deployId: Property.ShortText({
      displayName: 'Deploy ID',
      description: 'The ID of the deploy (e.g. dep-xxxxx)',
      required: true,
    }),
  },
  async run(context) {
    const { serviceId, deployId } = context.propsValue;
    const response = await fetch(
      `https://api.render.com/v1/services/${serviceId}/deploys/${deployId}`,
      {
        headers: {
          Authorization: `Bearer ${context.auth}`,
          Accept: 'application/json',
        },
      }
    );
    if (!response.ok) throw new Error(`Render API error: ${response.status}`);
    return response.json();
  },
});
