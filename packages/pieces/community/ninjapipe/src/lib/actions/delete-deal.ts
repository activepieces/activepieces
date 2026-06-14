import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth, ninjapipeCommon } from '../common';

export const deleteDeal = createAction({
  auth: ninjapipeAuth,
  name: 'delete_deal',
  displayName: 'Delete Deal',
  description: 'Deletes a deal by ID.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a deal identified by its ID. Destructive and not reversible; re-running after the deal is gone will fail since the ID no longer exists.', idempotent: false },
  props: {
    dealId: ninjapipeCommon.dealDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.DELETE, path: `/deals/${encodeURIComponent(String(context.propsValue.dealId))}` });
    return { success: true, deleted_id: context.propsValue.dealId };
  },
});
