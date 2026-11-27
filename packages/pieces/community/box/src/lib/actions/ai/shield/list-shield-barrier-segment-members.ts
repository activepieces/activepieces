import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listShieldBarrierSegmentMembersAction = createAction({
  auth: boxAuth,
  name: 'box_list_shield_barrier_segment_members',
  displayName: 'List Shield Barrier Segment Members',
  description: 'Lists the users in a Box Shield information barrier segment.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the memberships in a Shield information barrier segment, each with its member ID and user. Needs admin rights and the Box Shield add-on. Get the segment ID from List Shield Barrier Segments; page with Marker (next_marker).',
    idempotent: true,
  },
  props: {
    segmentId: boxAiProps.shieldSegmentId({ required: true }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/shield_information_barrier_segment_members',
      query: {
        shield_information_barrier_segment_id: propsValue.segmentId,
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
      },
    });
  },
});
