import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Broadcast } from '../../common/types';
import { kitBroadcastOutputSchema } from '../../output-schemas';

export const kitGetBroadcast = createAction({
  auth: convertkitAuth,
  name: 'kit_get_broadcast',
  classification: 'READ',
  outputSchema: kitBroadcastOutputSchema,
  displayName: 'Get Broadcast',
  description: 'Get the content and settings of one broadcast.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one broadcast by ID: subject, content, sender, schedule and public-post settings. Use Get Broadcast Stats for opens and clicks instead. Get the ID from List Broadcasts.',
    idempotent: true,
  },
  props: {
    broadcast_id: kitProps.id('Broadcast ID', 'The broadcast ID, from List Broadcasts.'),
  },
  async run(context) {
    const response = await kitClient.request<{ broadcast: Broadcast }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/broadcasts/${kitCommon.id({ value: context.propsValue.broadcast_id, label: 'Broadcast ID' })}`,
    });
    return response.body.broadcast;
  },
});
