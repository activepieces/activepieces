import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteShieldBarrierSegmentAction = createAction({
  auth: boxAuth,
  name: 'box_delete_shield_barrier_segment',
  displayName: 'Delete Shield Barrier Segment',
  description: 'Permanently deletes a Box Shield information barrier segment.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Shield information barrier segment; there is no trash for segments. Needs admin rights and the Box Shield add-on. Get the ID from List Shield Barrier Segments.',
    idempotent: false,
  },
  props: {
    segmentId: boxAiProps.shieldSegmentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/shield_information_barrier_segments/${encodeURIComponent(propsValue.segmentId)}`,
    });
    return { deleted: true, segmentId: propsValue.segmentId };
  },
});
