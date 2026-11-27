import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const createShieldBarrierSegmentMemberAction = createAction({
  auth: boxAuth,
  name: 'box_create_shield_barrier_segment_member',
  displayName: 'Create Shield Barrier Segment Member',
  description: 'Adds a user to a Box Shield information barrier segment.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a user to a Shield information barrier segment and returns the member ID. Needs admin rights and the Box Shield add-on. Get the segment ID from List Shield Barrier Segments and the user ID from List Users.',
    idempotent: false,
  },
  props: {
    segmentId: boxAiProps.shieldSegmentId({ required: true }),
    userId: boxAiProps.userId({
      required: true,
      description: 'Box user ID to add. Get it from List Users or Get Current User.',
    }),
    barrierId: boxAiProps.shieldBarrierId({
      required: false,
      description: 'ID of the barrier the segment belongs to. Get it from List Shield Barriers.',
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/shield_information_barrier_segment_members',
      body: {
        shield_information_barrier_segment: { id: propsValue.segmentId, type: 'shield_information_barrier_segment' },
        user: { id: propsValue.userId, type: 'user' },
        ...(propsValue.barrierId !== undefined
          ? { shield_information_barrier: { id: propsValue.barrierId, type: 'shield_information_barrier' } }
          : {}),
      },
    });
  },
});
