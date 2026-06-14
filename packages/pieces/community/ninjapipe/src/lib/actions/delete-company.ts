import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth, ninjapipeCommon } from '../common';

export const deleteCompany = createAction({
  auth: ninjapipeAuth,
  name: 'delete_company',
  displayName: 'Delete Company',
  description: 'Deletes a company by ID.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a company identified by its ID. Destructive and not reversible; re-running after the company is gone will fail since the ID no longer exists.', idempotent: false },
  props: {
    companyId: ninjapipeCommon.companyDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.DELETE, path: `/companies/${encodeURIComponent(String(context.propsValue.companyId))}` });
    return { success: true, deleted_id: context.propsValue.companyId };
  },
});
