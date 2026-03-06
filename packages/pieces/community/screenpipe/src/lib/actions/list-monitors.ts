import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { screenpipeAuth } from '../auth';
import { screenpipeApiRequest } from '../common';

export const listMonitors = createAction({
  auth: screenpipeAuth,
  name: 'list_monitors',
  displayName: 'List Monitors',
  description: 'List all available monitors and their details',
  props: {},
  async run(context) {
    return await screenpipeApiRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      endpoint: '/vision/list',
    });
  },
});
