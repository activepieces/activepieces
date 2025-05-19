import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { acuityschedulingAuth } from '../../index';
import { BASE_URL } from '../../index';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updatedScheduleTrigger = createTrigger({
  auth: acuityschedulingAuth,
  name: 'updated_schedule',
  displayName: 'Updated Schedule',
  description: 'Triggers when a staff member\'s schedule is updated',
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
      ## ActivityScheduling Webhook Setup
      To use this trigger, manually set up a webhook in your ActivityScheduling account:
      1. Go to **Settings** > **Webhooks**
      2. Enter this URL:
      \`\`\`text
      {{webhookUrl}}
      \`\`\`
      3. Select "Schedule Updated" as the event type
      4. Click Save to activate the webhook
      `,
    }),
    staff_filter: Property.ShortText({
      displayName: 'Staff ID Filter',
      description: 'Only trigger for specific staff members (leave blank for all)',
      required: false
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    "event_type": "schedule.updated",
    "data": {
      "staff_id": "staff_123",
      "changes": {
        "monday": {
          "old": {"start": "09:00", "end": "17:00"},
          "new": {"start": "10:00", "end": "18:00"}
        },
        "tuesday": {
          "old": {"start": "09:00", "end": "17:00"},
          "new": {"start": "08:00", "end": "16:00"}
        }
      },
      "updated_at": "2023-08-15T14:30:00Z",
      "updated_by": "admin@example.com"
    }
  },

  async onEnable() {
    // Manual webhook setup as per instructions
  },

  async onDisable() {
    // Manual webhook removal
  },

  async test(context) {
    const response = await httpClient.sendRequest({
      url: `${BASE_URL}/staff/schedule-changes`,
      method: HttpMethod.GET,
      queryParams: {
        limit: '3',
        sort: 'updated_at:desc'
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return response.body.data.changes || [];
  },

  async run(context) {
    const payload = context.payload.body as {
      event_type: string;
      data: {
        staff_id: string;
        changes: Record<string, any>;
        updated_at: string;
      };
    };

    // Verify event type
    if (payload.event_type !== 'schedule.updated') {
      return [];
    }

    // Apply staff filter if specified
    const staffFilter = context.propsValue.staff_filter;
    if (staffFilter && payload.data.staff_id !== staffFilter) {
      return [];
    }

    // Fetch full staff details
    const staffResponse = await httpClient.sendRequest({
      url: `${BASE_URL}/staff/${payload.data.staff_id}`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return [{
      ...payload.data,
      staff_details: staffResponse.body.data
    }];
  }
});