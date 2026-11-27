import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getShieldBarrierAction = createAction({
  auth: boxAuth,
  name: 'box_get_shield_barrier',
  displayName: 'Get Shield Barrier',
  description: 'Gets a Box Shield information barrier by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Shield information barrier with its status (draft, pending, enabled, disabled or invalid). Needs admin rights and the Box Shield add-on. Get the ID from List Shield Barriers or Create Shield Barrier.',
    idempotent: true,
  },
  props: {
    barrierId: boxAiProps.shieldBarrierId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/shield_information_barriers/${encodeURIComponent(propsValue.barrierId)}`,
    });
  },
});
