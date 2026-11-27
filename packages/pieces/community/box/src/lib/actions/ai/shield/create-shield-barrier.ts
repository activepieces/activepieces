import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const createShieldBarrierAction = createAction({
  auth: boxAuth,
  name: 'box_create_shield_barrier',
  displayName: 'Create Shield Barrier',
  description: 'Creates a Box Shield information barrier for the enterprise.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a Shield information barrier and returns its ID; add segments with Create Shield Barrier Segment, then enable it with Change Shield Barrier Status. Needs admin rights and the Box Shield add-on. Get the enterprise ID from Get Current User with Fields "enterprise".',
    idempotent: false,
  },
  props: {
    enterpriseId: boxAiProps.enterpriseId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/shield_information_barriers',
      body: { enterprise: { id: propsValue.enterpriseId, type: 'enterprise' } },
    });
  },
});
