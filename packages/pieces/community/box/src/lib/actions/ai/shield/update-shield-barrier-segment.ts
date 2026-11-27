import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const updateShieldBarrierSegmentAction = createAction({
  auth: boxAuth,
  name: 'box_update_shield_barrier_segment',
  displayName: 'Update Shield Barrier Segment',
  description: 'Renames or redescribes a Box Shield information barrier segment.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a Shield information barrier segment\'s name and/or description; only the fields given change. Needs admin rights and the Box Shield add-on. Get the ID from List Shield Barrier Segments.',
    idempotent: true,
  },
  props: {
    segmentId: boxAiProps.shieldSegmentId({ required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'New segment name.', required: false }),
    description: Property.LongText({ displayName: 'Description', description: 'New segment description.', required: false }),
  },
  async run({ auth, propsValue }) {
    const body = {
      ...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
      ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Give at least one of Name or Description.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/shield_information_barrier_segments/${encodeURIComponent(propsValue.segmentId)}`,
      body,
    });
  },
});
