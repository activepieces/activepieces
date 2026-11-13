import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { kitGetBroadcastStatsOutputSchema } from '../../output-schemas';

type BroadcastStats = {
  id?: number;
  stats?: Record<string, unknown>;
};

export const kitGetBroadcastStats = createAction({
  auth: convertkitAuth,
  name: 'kit_get_broadcast_stats',
  classification: 'READ',
  outputSchema: kitGetBroadcastStatsOutputSchema,
  displayName: 'Get Broadcast Stats',
  description: 'Get delivery and engagement stats for one broadcast.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the stats of one broadcast by ID: recipients, open rate, click rate, unsubscribes, total clicks, status and send progress. Use Get Broadcast for its content instead. A draft that was never sent reports zero counts.',
    idempotent: true,
  },
  props: {
    broadcast_id: kitProps.id('Broadcast ID', 'The broadcast ID, from List Broadcasts.'),
  },
  async run(context) {
    const broadcastId = kitCommon.id({ value: context.propsValue.broadcast_id, label: 'Broadcast ID' });
    const response = await kitClient.request<{
      broadcast: BroadcastStats | BroadcastStats[];
    }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/broadcasts/${broadcastId}/stats`,
    });
    const raw = response.body.broadcast;
    const broadcast = Array.isArray(raw) ? raw[0] : raw;
    return {
      broadcast_id: broadcast?.id ?? Number(broadcastId),
      ...(broadcast?.stats ?? {}),
    };
  },
});
