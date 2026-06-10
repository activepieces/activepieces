import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendProps } from '../common/props';

export const deleteBroadcast = createAction({
  name: 'delete_broadcast',
  auth: resendAuth,
  displayName: 'Delete Broadcast',
  description: 'Permanently delete a broadcast from your Resend account',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a broadcast from the Resend account, identified by broadcast ID. Use this to remove a draft or unwanted campaign; only broadcasts that have not been sent can be deleted. Effectively idempotent — once deleted, repeating the call has no further effect.', idempotent: true },
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
