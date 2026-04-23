import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const getCompany = createAction({
  auth: ninjapipeAuth,
  name: 'get_company',
  displayName: 'Get Company',
  description: 'Retrieves a company by ID.',
  props: {
    companyId: Property.ShortText({ displayName: 'Company ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.GET, path: `/companies/${context.propsValue.companyId}` });
    return flattenCustomFields(response.body);
  },
});
