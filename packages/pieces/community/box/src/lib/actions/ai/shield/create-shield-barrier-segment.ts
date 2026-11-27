import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const createShieldBarrierSegmentAction = createAction({
  auth: boxAuth,
  name: 'box_create_shield_barrier_segment',
  displayName: 'Create Shield Barrier Segment',
  description: 'Creates a segment in a Box Shield information barrier.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a named segment in a Shield information barrier and returns its ID; add users with Create Shield Barrier Segment Member and block segments from each other with Create Shield Barrier Segment Restriction. Needs admin rights and the Box Shield add-on. Get the barrier ID from List Shield Barriers.',
    idempotent: false,
  },
  props: {
    barrierId: boxAiProps.shieldBarrierId({ required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'Segment name, e.g. "Investment Banking".', required: true }),
    description: Property.LongText({ displayName: 'Description', description: 'Segment description.', required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/shield_information_barrier_segments',
      body: {
        shield_information_barrier: { id: propsValue.barrierId, type: 'shield_information_barrier' },
        name: propsValue.name,
        ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
      },
    });
  },
});
