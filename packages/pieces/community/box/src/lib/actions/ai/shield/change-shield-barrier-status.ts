import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const STATUSES = ['pending', 'disabled'];

export const changeShieldBarrierStatusAction = createAction({
  auth: boxAuth,
  name: 'box_change_shield_barrier_status',
  displayName: 'Change Shield Barrier Status',
  description: 'Enables or disables a Box Shield information barrier.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets a Shield information barrier to "pending" (Box then enables it) or "disabled". Needs admin rights and the Box Shield add-on. Get the ID from List Shield Barriers or Create Shield Barrier.',
    idempotent: true,
  },
  props: {
    barrierId: boxAiProps.shieldBarrierId({ required: true }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: '"pending" to start enabling the barrier, or "disabled" to turn it off.',
      required: true,
      options: { options: STATUSES.map((value) => ({ label: value, value })) },
    }),
  },
  async run({ auth, propsValue }) {
    if (!STATUSES.includes(propsValue.status)) {
      throw new Error(`Status must be one of: ${STATUSES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/shield_information_barriers/change_status',
      body: { id: propsValue.barrierId, status: propsValue.status },
    });
  },
});
