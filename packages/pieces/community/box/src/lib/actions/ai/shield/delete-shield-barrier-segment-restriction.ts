import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteShieldBarrierSegmentRestrictionAction = createAction({
  auth: boxAuth,
  name: 'box_delete_shield_barrier_segment_restriction',
  displayName: 'Delete Shield Barrier Segment Restriction',
  description: 'Deletes a Box Shield information barrier segment restriction.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Shield segment restriction, so the two segments are no longer blocked from each other; recreate it with Create Shield Barrier Segment Restriction. Needs admin rights and the Box Shield add-on. Get the ID from List Shield Barrier Segment Restrictions.',
    idempotent: false,
  },
  props: {
    restrictionId: boxAiProps.shieldSegmentRestrictionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/shield_information_barrier_segment_restrictions/${encodeURIComponent(propsValue.restrictionId)}`,
    });
    return { deleted: true, restrictionId: propsValue.restrictionId };
  },
});
