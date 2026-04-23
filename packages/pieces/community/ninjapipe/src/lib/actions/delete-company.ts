import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth } from '../common';

export const deleteCompany = createAction({
  auth: ninjapipeAuth,
  name: 'delete_company',
  displayName: 'Delete Company',
  description: 'Deletes a company by ID.',
  props: {
    companyId: Property.ShortText({ displayName: 'Company ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.DELETE, path: `/companies/${context.propsValue.companyId}` });
    return { success: true, deleted_id: context.propsValue.companyId };
  },
});
