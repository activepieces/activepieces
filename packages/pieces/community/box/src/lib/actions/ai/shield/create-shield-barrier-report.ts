import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const createShieldBarrierReportAction = createAction({
  auth: boxAuth,
  name: 'box_create_shield_barrier_report',
  displayName: 'Create Shield Barrier Report',
  description: 'Starts a report on a Box Shield information barrier.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts building a report for a Shield information barrier and returns the report ID with its status; poll Get Shield Barrier Report until the status is "done". Needs admin rights and the Box Shield add-on. Get the barrier ID from List Shield Barriers.',
    idempotent: false,
  },
  props: {
    barrierId: boxAiProps.shieldBarrierId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/shield_information_barrier_reports',
      body: { shield_information_barrier: { id: propsValue.barrierId, type: 'shield_information_barrier' } },
    });
  },
});
