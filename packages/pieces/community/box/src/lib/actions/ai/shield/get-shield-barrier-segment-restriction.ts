import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getShieldBarrierSegmentRestrictionAction = createAction({
  auth: boxAuth,
  name: 'box_get_shield_barrier_segment_restriction',
  displayName: 'Get Shield Barrier Segment Restriction',
  description: 'Gets a Box Shield information barrier segment restriction by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Shield segment restriction: the segment and the restricted segment its members cannot collaborate with. Needs admin rights and the Box Shield add-on. Get the ID from List Shield Barrier Segment Restrictions or Create Shield Barrier Segment Restriction.',
    idempotent: true,
  },
  props: {
    restrictionId: boxAiProps.shieldSegmentRestrictionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/shield_information_barrier_segment_restrictions/${encodeURIComponent(propsValue.restrictionId)}`,
    });
  },
});
