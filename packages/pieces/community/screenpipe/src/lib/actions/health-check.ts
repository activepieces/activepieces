import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { screenpipeAuth } from '../auth';
import { screenpipeApiRequest } from '../common';

export const healthCheck = createAction({
  auth: screenpipeAuth,
  name: 'health_check',
  displayName: 'Health Check',
  description:
    'Check the health and status of your Screenpipe instance',
  props: {},
  async run(context) {
    return await screenpipeApiRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      endpoint: '/health',
    });
  },
});
