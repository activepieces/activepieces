import { createAction, Property } from '@activepieces/pieces-framework';
import { renderAuth } from '../render';

export const listDeploys = createAction({
  name: 'list_deploys',
  displayName: 'List Deploys',
  description: 'List recent deploys for a Render service',
  auth: renderAuth,
  props: {
    serviceId: Property.ShortText({
      displayName: 'Service ID',
      description: 'The ID of the service (e.g. srv-xxxxx)',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of deploys to return',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { serviceId, limit } = context.propsValue;
    const response = await fetch(
      `https://api.render.com/v1/services/${serviceId}/deploys?limit=${limit ?? 10}`,
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
