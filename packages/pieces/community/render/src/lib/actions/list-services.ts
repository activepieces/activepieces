import { createAction } from '@activepieces/pieces-framework';
import { renderAuth } from '../render';

export const listServices = createAction({
  name: 'list_services',
  displayName: 'List Services',
  description: 'List all services in your Render account',
  auth: renderAuth,
  props: {},
  async run(context) {
    const response = await fetch('https://api.render.com/v1/services?limit=20', {
      headers: {
        Authorization: `Bearer ${context.auth}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) throw new Error(`Render API error: ${response.status}`);
    const data = await response.json();
    return data;
  },
});
