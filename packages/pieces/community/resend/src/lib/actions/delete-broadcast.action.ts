import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendProps } from '../common/props';

export const deleteBroadcast = createAction({
  name: 'delete_broadcast',
  auth: resendAuth,
  displayName: 'Delete Broadcast',
  description: 'Permanently delete a broadcast from your Resend account',
  props: {
    broadcast_id: resendProps.broadcastId,
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest<{ object: string; id: string; deleted: boolean }>({
      method: HttpMethod.DELETE,
      url: `https://api.resend.com/broadcasts/${propsValue.broadcast_id}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return response.body;
  },
});
