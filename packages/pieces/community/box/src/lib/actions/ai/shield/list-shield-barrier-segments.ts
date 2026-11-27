import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listShieldBarrierSegmentsAction = createAction({
  auth: boxAuth,
  name: 'box_list_shield_barrier_segments',
  displayName: 'List Shield Barrier Segments',
  description: 'Lists the segments of a Box Shield information barrier.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the segments in a Shield information barrier, with their IDs and names. Needs admin rights and the Box Shield add-on. Get the barrier ID from List Shield Barriers; page with Marker (next_marker).',
    idempotent: true,
  },
  props: {
    barrierId: boxAiProps.shieldBarrierId({ required: true }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/shield_information_barrier_segments',
      query: {
        shield_information_barrier_id: propsValue.barrierId,
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
      },
    });
  },
});
