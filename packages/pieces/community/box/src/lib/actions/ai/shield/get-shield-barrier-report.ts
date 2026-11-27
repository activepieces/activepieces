import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';

export const getShieldBarrierReportAction = createAction({
  auth: boxAuth,
  name: 'box_get_shield_barrier_report',
  displayName: 'Get Shield Barrier Report',
  description: 'Gets a Box Shield information barrier report by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads a Shield information barrier report once, with its status (pending, error, done or cancelled) and details. Needs admin rights and the Box Shield add-on. Get the ID from Create Shield Barrier Report or List Shield Barrier Reports.',
    idempotent: true,
  },
  props: {
    reportId: Property.ShortText({
      displayName: 'Report ID',
      description: 'Shield information barrier report ID. Get it from Create Shield Barrier Report or List Shield Barrier Reports.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/shield_information_barrier_reports/${encodeURIComponent(propsValue.reportId)}`,
    });
  },
});
