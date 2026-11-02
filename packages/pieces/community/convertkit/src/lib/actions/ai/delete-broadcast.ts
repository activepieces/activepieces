import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { kitDeleteBroadcastOutputSchema } from '../../output-schemas';

export const kitDeleteBroadcast = createAction({
  auth: convertkitAuth,
  name: 'kit_delete_broadcast',
  classification: 'DESTRUCTIVE',
  outputSchema: kitDeleteBroadcastOutputSchema,
  displayName: 'Delete Broadcast',
  description: 'Permanently delete a broadcast.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a draft or scheduled broadcast by ID; a scheduled one will not be sent. It cannot be undone, and a repeat call fails once the broadcast is gone. Confirm the ID with Get Broadcast first.',
    idempotent: false,
  },
  props: {
    broadcast_id: kitProps.id('Broadcast ID', 'The broadcast ID, from List Broadcasts.'),
  },
  async run(context) {
    const broadcastId = kitCommon.id({ value: context.propsValue.broadcast_id, label: 'Broadcast ID' });
    await kitClient.request<unknown>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/broadcasts/${broadcastId}`,
    });
    return { success: true, broadcast_id: broadcastId };
  },
});
