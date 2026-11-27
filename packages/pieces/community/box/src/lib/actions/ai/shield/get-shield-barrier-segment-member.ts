import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getShieldBarrierSegmentMemberAction = createAction({
  auth: boxAuth,
  name: 'box_get_shield_barrier_segment_member',
  displayName: 'Get Shield Barrier Segment Member',
  description: 'Gets a Box Shield information barrier segment member by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Shield information barrier segment membership with its user, segment and barrier. Needs admin rights and the Box Shield add-on. Get the ID from List Shield Barrier Segment Members or Create Shield Barrier Segment Member.',
    idempotent: true,
  },
  props: {
    memberId: boxAiProps.shieldSegmentMemberId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/shield_information_barrier_segment_members/${encodeURIComponent(propsValue.memberId)}`,
    });
  },
});
