import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Broadcast } from '../../common/types';
import { kitListBroadcastsOutputSchema } from '../../output-schemas';

export const kitListBroadcasts = createAction({
  auth: convertkitAuth,
  name: 'kit_list_broadcasts',
  classification: 'SEARCH',
  outputSchema: kitListBroadcastsOutputSchema,
  displayName: 'List Broadcasts',
  description: 'List broadcasts (one-off emails), 50 per page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists broadcasts with their ID, subject and creation time, 50 per page. Use it to find a broadcast ID for Get Broadcast, Get Broadcast Stats or Delete Broadcast. Increase Page until fewer than 50 are returned to see older ones.',
    idempotent: true,
  },
  props: {
    page: kitProps.page('Page number, 50 broadcasts per page. Defaults to 1.'),
    sort_order: kitProps.sortOrder('Sort by creation date. Kit defaults to ascending (oldest first).'),
  },
  async run(context) {
    const page = kitCommon.page(context.propsValue.page);
    const response = await kitClient.request<{ broadcasts: Broadcast[] }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/broadcasts',
      query: { page, sort_order: context.propsValue.sort_order },
    });
    const broadcasts = response.body.broadcasts ?? [];
    return { broadcasts, count: broadcasts.length, page };
  },
});
