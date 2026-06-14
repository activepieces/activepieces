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
  audience: 'both',
  aiMetadata: {
    description:
      'Marks a specific scheduled activity on a Wayfront client as complete. Use to close out a follow-up or task once done; requires both the client user ID and the activity ID. Idempotent: completing an already-completed activity leaves it complete with no additional effect.',
    idempotent: true,
  },
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
