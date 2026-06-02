import { createAction } from '@activepieces/pieces-framework';
import { wayfrontAuth } from '../auth';
import {
  activitiesDropdown,
  clientsDropdown,
  flattenActivity,
  wayfrontApiClient,
  WayfrontActivity,
  WayfrontAuthType,
} from '../common';

export const completeActivityAction = createAction({
  auth: wayfrontAuth,
  name: 'complete_activity',
  displayName: 'Complete Activity',
  description: 'Marks a scheduled activity as complete for a client in Wayfront.',
  props: {
    user_id: clientsDropdown,
    activity_id: activitiesDropdown,
  },
  async run(context) {
    const auth = context.auth as unknown as WayfrontAuthType;
    const p = context.propsValue;

    const response = await wayfrontApiClient(auth.workspaceUrl, auth.apiToken).post<WayfrontActivity>(
      `/clients/${p.user_id}/activities/${p.activity_id}/complete`,
    );

    return flattenActivity(response.body);
  },
});
