import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { acuityschedulingAuth } from '../../index';
import { BASE_URL } from '../../index';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const appointmentRescheduledTrigger = createTrigger({
  auth: acuityschedulingAuth,
  name: 'appointment_rescheduled',
  displayName: 'Appointment Rescheduled',
  description: 'Triggers when a specific appointment is rescheduled',
  props: {
    appointment_id: Property.ShortText({
      displayName: 'Appointment ID',
      description: 'The ID of the appointment to monitor for rescheduling',
      required: true,
    }),
    webhookInstructions: Property.MarkDown({
      value: `
      ## AcuityScheduling Webhook Setup
      To use this trigger, manually set up a webhook in your AcuityScheduling account:
      1. Go to **Settings** > **Webhooks**
      2. Enter this URL:
      \`\`\`text
      {{webhookUrl}}
      \`\`\`
      3. Select "Appointment Rescheduled" as the event type
      4. Click Save to activate the webhook
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    "event_type": "appointment.rescheduled",
    "data": {
      "appointment_id": "12345",
      "old_time": "2023-08-15T14:30:00Z",
      "new_time": "2023-08-15T15:30:00Z",
      "calendar_id": "67890",
      "updated_at": "2023-08-14T10:15:00Z"
    }
  },

  async onEnable(context) {
    // No need to register webhooks programmatically as user will do it manually
  },
  async onDisable(context) {
    // No cleanup needed as webhooks are managed by the user
  },

  async test(context) {
    const { appointment_id } = context.propsValue;
    
    // Test by checking recent appointment changes
    const response = await httpClient.sendRequest({
      url: `${BASE_URL}/appointments/${appointment_id}/reschedule`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BASIC,
        username: context.auth.userId.toString(),
        password: context.auth.apiKey,
      },
    });

    return response.body.data || [];
  },

  async run(context) {
    const { appointment_id } = context.propsValue;
    const payload = context.payload.body as {
      event_type: string;
      data: {
        appointment_id: string;
        old_time: string;
        new_time: string;
        calendar_id?: string;
        updated_at: string;
      };
    };

    // Verify event type
    if (payload.event_type !== 'appointment.rescheduled') {
      return [];
    }

    // Verify it's the appointment we're monitoring
    if (payload.data.appointment_id !== appointment_id) {
      return [];
    }

    // Return the rescheduling details
    return [payload.data];
  }
});