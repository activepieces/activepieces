import { createAction, Property } from '@activepieces/pieces-framework';
import { wayfrontAuth } from '../auth';
import {
  clientsDropdown,
  flattenActivity,
  teamMembersDropdown,
  wayfrontApiClient,
  WayfrontActivity,
  WayfrontAuthType,
} from '../common';

export const createActivityAction = createAction({
  auth: wayfrontAuth,
  name: 'create_activity',
  displayName: 'Create Activity',
  description: 'Creates a new activity log entry for a client in Wayfront.',
  audience: 'both',
  aiMetadata: {
    description:
      'Logs a new activity (note) against a specific Wayfront client, optionally scheduling it for a future date and assigning it to a team member. With no scheduled date it is logged immediately. Use to record an interaction or queue a follow-up; requires the client user ID and content. Not idempotent: each call appends a separate activity.',
    idempotent: false,
  },
  props: {
    user_id: clientsDropdown,
    content: Property.LongText({
      displayName: 'Content',
      description: 'The activity note or description (max 10,000 characters).',
      required: true,
    }),
    scheduled_at: Property.ShortText({
      displayName: 'Scheduled At',
      description:
        'Schedule this activity for a future date and time. Format: 2026-04-15T14:00:00Z (ISO 8601). Leave empty to log it immediately.',
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

    const response = await wayfrontApiClient(auth.workspaceUrl, auth.apiToken).post<WayfrontActivity>(
      `/clients/${p.user_id}/activities`,
      body,
    );

    return flattenActivity(response.body);
  },
});
