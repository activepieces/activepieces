import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';
import { freshserviceCommon } from '../common/props';

export const deleteChange = createAction({
  auth: freshserviceAuth,
  name: 'delete_change',
  displayName: 'Delete Change',
  description: 'Deletes a change request from Freshservice.',
  props: {
    change_id: freshserviceCommon.change(true),
  },
  async run(context) {
    await freshserviceApiCall({
      method: HttpMethod.DELETE,
      endpoint: `changes/${context.propsValue.change_id}`,
      auth: context.auth,
    });

    return { success: true };
  },
});
