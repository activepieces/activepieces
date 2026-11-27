import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getShieldBarrierSegmentAction = createAction({
  auth: boxAuth,
  name: 'box_get_shield_barrier_segment',
  displayName: 'Get Shield Barrier Segment',
  description: 'Gets a Box Shield information barrier segment by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Shield information barrier segment with its name, description and barrier. Needs admin rights and the Box Shield add-on. Get the ID from List Shield Barrier Segments or Create Shield Barrier Segment.',
    idempotent: true,
  },
  props: {
    segmentId: boxAiProps.shieldSegmentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/shield_information_barrier_segments/${encodeURIComponent(propsValue.segmentId)}`,
    });
  },
});
