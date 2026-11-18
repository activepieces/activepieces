import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ntfyAuth } from '../auth';
import { ntfyClient } from '../common/client';
import { serverStatsOutputSchema } from '../output-schemas';

export const getServerStats = createAction({
  auth: ntfyAuth,
  name: 'ntfy_get_server_stats',
  classification: 'READ',
  displayName: 'Get Server Stats',
  description: 'Get the total number of messages the ntfy server has published and its current message rate.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns server-wide statistics for the ntfy server on the connection: total messages published and the recent average messages per second. Use to gauge server load; use Get Account for this account\'s own quota. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: serverStatsOutputSchema,
  async run({ auth }) {
    const response = await ntfyClient.request<{ messages?: number; messages_rate?: number }>({
      auth,
      method: HttpMethod.GET,
      path: '/v1/stats',
    });
    return {
      messages: response.body?.messages ?? null,
      messages_rate: response.body?.messages_rate ?? null,
    };
  },
});
