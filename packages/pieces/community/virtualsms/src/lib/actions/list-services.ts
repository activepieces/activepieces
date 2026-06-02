import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

export const listServices = createAction({
  auth: virtualSmsAuth,
  name: 'list_services',
  displayName: 'List Services',
  description: 'List all available services with their short codes and base prices.',
  props: {
    include_voip: Property.Checkbox({
      displayName: 'Include VoIP Numbers',
      description:
        'Also include VoIP (non-physical SIM) numbers. Defaults to physical SIM only.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    return request(auth, HttpMethod.GET, '/api/v1/customer/services', undefined, {
      include_voip: propsValue.include_voip ? 'true' : undefined,
    });
  },
});
