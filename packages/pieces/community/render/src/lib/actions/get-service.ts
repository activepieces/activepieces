import { createAction, Property } from '@activepieces/pieces-framework';
import { renderAuth } from '../render';

export const getService = createAction({
  name: 'get_service',
  displayName: 'Get Service',
  description: 'Get details for a specific Render service',
  auth: renderAuth,
  props: {
    serviceId: Property.ShortText({
      displayName: 'Service ID',
      description: 'The ID of the service (e.g. srv-xxxxx)',
      required: true,
    }),
  },
  async run(context) {
    const { serviceId } = context.propsValue;
    const response = await fetch(`https://api.render.com/v1/services/${serviceId}`, {
      headers: {
        Authorization: `Bearer ${context.auth}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) throw new Error(`Render API error: ${response.status}`);
    return response.json();
  },
});
