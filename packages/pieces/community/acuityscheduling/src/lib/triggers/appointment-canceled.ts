import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { acuityschedulingAuth } from '../../index';
import { BASE_URL } from '../../index';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const canceledAppointmentTrigger = createTrigger({
  auth: acuityschedulingAuth,
  name: 'canceled_appointment',
  displayName: 'Canceled Appointment',
  description: 'Triggered when an appointment is canceled',
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
      ## ActivityScheduling Webhook Setup
      To use this trigger, you need to manually set up a webhook in your ActivityScheduling account:
      1. Login to your ActivityScheduling account.
      2. Navigate to **Settings** > **Webhooks**.
      3. Enter the following URL in the webhooks field:
      \`\`\`text
      {{webhookUrl}}
      \`\`\`
      4. Select "Appointment Canceled" as the event type.
      5. Click Save to register the webhook.
      This webhook will be triggered when an appointment is canceled.
      `,
    }),
    include_past: Property.Checkbox({
      displayName: 'Include Past Appointments',
      description: 'Trigger for previously canceled appointments',
      required: false,
      defaultValue: false
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    "id": "apt_12345",
    "status": "canceled",
    "title": "Annual Checkup",
    "start_time": "2025-08-15T09:00:00Z",
    "end_time": "2025-08-15T10:00:00Z",
    "client": {
      "id": "cli_67890",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1232324327"
    },
    "canceled_at": "2025-08-14T14:30:00Z",
    "canceled_by": "client",
    "cancelation_reason": "Scheduling conflict"
  },

  async onEnable(context) {
    // No need to register webhooks programmatically as user will do it manually
  },

  async onDisable(context) {
    // No need to unregister webhooks as user will do it manually
  },

  async test(context) {
    const response = await httpClient.sendRequest<{ data: { appointments: Record<string, any>[] } }>({
      url: `${BASE_URL}/appointments`,
      method: HttpMethod.GET,
      queryParams: {
        status: 'canceled',
        limit: '5'
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return response.body.data.appointments;
  },

  async run(context) {
    const payload = context.payload.body as { 
      event_type: string; 
      data: Record<string, any> 
    };
    
    if (payload.event_type !== 'appointment.canceled') {
      return [];
    }

    const includePast = context.propsValue.include_past ?? false;
    const appointmentDate = new Date(payload.data['start_time']);
    const now = new Date();

    if (!includePast && appointmentDate < now) {
      return [];
    }

    // Fetch full appointment details
    const response = await httpClient.sendRequest({
      url: `${BASE_URL}/appointments/${payload.data['id']}`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return [response.body.data];
  }
});