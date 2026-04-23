import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const getDeal = createAction({
  auth: ninjapipeAuth,
  name: 'get_deal',
  displayName: 'Get Deal',
  description: 'Retrieves a deal by ID.',
  props: {
    dealId: Property.ShortText({ displayName: 'Deal ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.GET, path: `/deals/${context.propsValue.dealId}` });
    return flattenCustomFields(response.body);
  },
});
