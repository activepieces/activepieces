import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteShieldBarrierSegmentMemberAction = createAction({
  auth: boxAuth,
  name: 'box_delete_shield_barrier_segment_member',
  displayName: 'Delete Shield Barrier Segment Member',
  description: 'Removes a user from a Box Shield information barrier segment.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes a user from a Shield information barrier segment by deleting the membership; the user account is not affected and can be added back with Create Shield Barrier Segment Member. Needs admin rights and the Box Shield add-on. Get the member ID from List Shield Barrier Segment Members.',
    idempotent: false,
  },
  props: {
    memberId: boxAiProps.shieldSegmentMemberId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/shield_information_barrier_segment_members/${encodeURIComponent(propsValue.memberId)}`,
    });
    return { deleted: true, memberId: propsValue.memberId };
  },
});
