import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { getBroadcastOutputSchema } from '../output-schemas';

export const getBroadcast = createAction({
  name: 'get_broadcast',
  classification: 'READ',
  auth: resendAuth,
  displayName: 'Get Broadcast',
  outputSchema: getBroadcastOutputSchema,
  description: 'Retrieve a single broadcast by its ID',
  audience: 'ai',
  aiMetadata: { description: 'Retrieves the full details of a single broadcast (subject, body, status, schedule) by its ID, including whether it has been sent. Use this to inspect a specific broadcast before editing or sending it; use List Broadcasts to find the ID. Read-only and idempotent.', idempotent: true },
  props: {
    broadcast_id: resendProps.broadcastId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest({ auth: auth.secret_text, method: HttpMethod.GET, path: `/broadcasts/${propsValue.broadcast_id}` });
  },
});
