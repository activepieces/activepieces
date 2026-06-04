import { createAction, Property } from '@activepieces/pieces-framework';
import { wayfrontAuth } from '../auth';
import {
  activitiesDropdown,
  clientsDropdown,
  flattenActivity,
  teamMembersDropdown,
  wayfrontApiClient,
  WayfrontActivity,
  WayfrontAuthType,
} from '../common';

export const updateActivityAction = createAction({
  auth: wayfrontAuth,
  name: 'update_activity',
  displayName: 'Update Activity',
  description: 'Updates an existing activity for a client in Wayfront.',
  props: {
    user_id: clientsDropdown,
    activity_id: activitiesDropdown,
    content: Property.LongText({
      displayName: 'Content',
      description: 'The updated activity note or description (max 10,000 characters).',
      required: true,
    }),
    scheduled_at: Property.ShortText({
      displayName: 'Scheduled At',
      description:
        'Reschedule the activity. Format: 2026-05-01T14:00:00Z (ISO 8601). Only applies to already-scheduled activities.',
      required: false,
    }),
    assigned_to: teamMembersDropdown,
  },
  async run(context) {
    const auth = context.auth as unknown as WayfrontAuthType;
    const p = context.propsValue;

    const body: Record<string, unknown> = { content: p.content };
    if (p.scheduled_at) body['scheduled_at'] = p.scheduled_at;
    if (p.assigned_to) body['assigned_to'] = p.assigned_to;

    const response = await wayfrontApiClient(auth.workspaceUrl, auth.apiToken).put<WayfrontActivity>(
      `/clients/${p.user_id}/activities/${p.activity_id}`,
      body,
    );

    return flattenActivity(response.body);
  },
});
