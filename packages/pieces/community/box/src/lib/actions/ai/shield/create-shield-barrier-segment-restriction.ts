import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const createShieldBarrierSegmentRestrictionAction = createAction({
  auth: boxAuth,
  name: 'box_create_shield_barrier_segment_restriction',
  displayName: 'Create Shield Barrier Segment Restriction',
  description: 'Blocks one Box Shield segment from collaborating with another.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Restricts the members of a Shield segment from collaborating with the members of another segment and returns the restriction ID. Needs admin rights and the Box Shield add-on. Get both segment IDs from List Shield Barrier Segments.',
    idempotent: false,
  },
  props: {
    segmentId: boxAiProps.shieldSegmentId({
      required: true,
      description: 'ID of the segment whose members get restricted. Get it from List Shield Barrier Segments.',
    }),
    restrictedSegmentId: boxAiProps.shieldSegmentId({
      required: true,
      displayName: 'Restricted Segment ID',
      description: 'ID of the segment they may not collaborate with. Get it from List Shield Barrier Segments.',
    }),
    barrierId: boxAiProps.shieldBarrierId({
      required: false,
      description: 'ID of the barrier both segments belong to. Get it from List Shield Barriers.',
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/shield_information_barrier_segment_restrictions',
      body: {
        type: 'shield_information_barrier_segment_restriction',
        shield_information_barrier_segment: { id: propsValue.segmentId, type: 'shield_information_barrier_segment' },
        restricted_segment: { id: propsValue.restrictedSegmentId, type: 'shield_information_barrier_segment' },
        ...(propsValue.barrierId !== undefined
          ? { shield_information_barrier: { id: propsValue.barrierId, type: 'shield_information_barrier' } }
          : {}),
      },
    });
  },
});
