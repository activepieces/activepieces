import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const getCompany = createAction({
  auth: ninjapipeAuth,
  name: 'get_company',
  displayName: 'Get Company',
  description: 'Retrieves a company by ID.',
  props: {
    companyId: ninjapipeCommon.companyDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: `/companies/${encodeURIComponent(String(context.propsValue.companyId))}` });
    return flattenCustomFields(response.body);
  },
});
