import { createAction, Property } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { assembledAuth } from '../common/auth';

export const deleteOOO = createAction({
  auth: assembledAuth,
  name: 'delete_OOO',
  displayName: 'Delete OOO Request',
  description: 'Cancel/delete a OOO request.',
  audience: 'both',
  aiMetadata: { description: 'Cancels (deletes) a time-off request in Assembled, identified by its OOO ID. Use to revoke a previously submitted out-of-office request. Because the cancellation is keyed on the request ID, repeating the call leaves the request cancelled, so it is idempotent.', idempotent: true },
  props: {
    OOO_id: Property.ShortText({
      displayName: 'OOO ID',
      required: true,
    }),
  },
  async run(context) {
    const { OOO_id } = context.propsValue;

    const response = await assembledCommon.makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/time_off/${OOO_id}/cancel`,
      {} 
    );

    return {
      success: true,
      message: 'OOO request deleted successfully',
      data: response.body,
    };
  },
});