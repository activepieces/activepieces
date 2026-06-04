import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const getDeal = createAction({
  auth: ninjapipeAuth,
  name: 'get_deal',
  displayName: 'Get Deal',
  description: 'Retrieves a deal by ID.',
  props: {
    dealId: ninjapipeCommon.dealDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: `/deals/${encodeURIComponent(String(context.propsValue.dealId))}` });
    return flattenCustomFields(response.body);
  },
});
