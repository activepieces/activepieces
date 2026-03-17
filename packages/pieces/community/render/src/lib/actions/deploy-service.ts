import { createAction, Property } from '@activepieces/pieces-framework';
import { renderAuth } from '../render';

export const deployService = createAction({
  name: 'deploy_service',
  displayName: 'Deploy Service',
  description: 'Trigger a new deploy for a Render service',
  auth: renderAuth,
  props: {
    serviceId: Property.ShortText({
      displayName: 'Service ID',
      description: 'The ID of the service (e.g. srv-xxxxx)',
      required: true,
    }),
    clearCache: Property.Checkbox({
      displayName: 'Clear Cache',
      description: 'Whether to clear the build cache before deploying',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { serviceId, clearCache } = context.propsValue;
    const response = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${context.auth}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clearCache: clearCache ? 'clear' : 'do_not_clear' }),
    });
    if (!response.ok) throw new Error(`Render API error: ${response.status}`);
    return response.json();
  },
});
