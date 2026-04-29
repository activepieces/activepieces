import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth, ninjapipeCommon } from '../common';

export const deleteDeal = createAction({
  auth: ninjapipeAuth,
  name: 'delete_deal',
  displayName: 'Delete Deal',
  description: 'Deletes a deal by ID.',
  props: {
    dealId: ninjapipeCommon.dealDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.DELETE, path: `/deals/${encodeURIComponent(String(context.propsValue.dealId))}` });
    return { success: true, deleted_id: context.propsValue.dealId };
  },
});
