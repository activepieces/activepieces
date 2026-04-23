import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth } from '../common';

export const deleteDeal = createAction({
  auth: ninjapipeAuth,
  name: 'delete_deal',
  displayName: 'Delete Deal',
  description: 'Deletes a deal by ID.',
  props: {
    dealId: Property.ShortText({ displayName: 'Deal ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.DELETE, path: `/deals/${context.propsValue.dealId}` });
    return { success: true, deleted_id: context.propsValue.dealId };
  },
});
