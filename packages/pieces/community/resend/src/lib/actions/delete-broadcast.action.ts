import { createAction } from '@activepieces/pieces-framework';
import { deleteBroadcastOutputSchema } from '../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';

export const deleteBroadcast = createAction({
  name: 'delete_broadcast',
  classification: 'DESTRUCTIVE',
  auth: resendAuth,
  displayName: 'Delete Broadcast',
  outputSchema: deleteBroadcastOutputSchema,
  description: 'Permanently delete a broadcast from your Resend account',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a broadcast from the Resend account, identified by broadcast ID. Use this to remove a draft or unwanted campaign; only broadcasts that have not been sent can be deleted. Effectively idempotent — once deleted, repeating the call has no further effect.', idempotent: true },
  props: {
    broadcast_id: resendProps.broadcastId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ object: string; id: string; deleted: boolean }>({ auth: auth.secret_text, method: HttpMethod.DELETE, path: `/broadcasts/${propsValue.broadcast_id}` });
  },
});
