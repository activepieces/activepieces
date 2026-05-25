import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

export const listServices = createAction({
  auth: virtualSmsAuth,
  name: 'list_services',
  displayName: 'List Services',
  description: 'List all available services with their short codes and base prices',
  props: {},
  async run({ auth }) {
    return request(auth, HttpMethod.GET, '/api/v1/customer/services');
  },
});
