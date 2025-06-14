import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { acuityschedulingAuth } from '../../index';
import { BASE_URL } from '../../index';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const cancelledAppointmentTrigger = createTrigger({
  auth: acuityschedulingAuth,
  name: 'canceled_appointment',
  displayName: 'Canceled Appointment',
  description: 'Triggered when an appointment is canceled',
  props: {
    appointment_id: Property.Dropdown({
      displayName: 'Appointment ID',
      description: 'Select an appointment for cancellations',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        const authData = auth as { userId: string | number, apiKey: string };

        try {
          const response = await httpClient.sendRequest<{
            status: string;
            data: Array<{
              id: string | number;
              calendar: string;
              datetime: string;
              status: string;
            }>;
          }>({
            method: HttpMethod.GET,
            url: `${BASE_URL}/appointments`,
            authentication: {
              type: AuthenticationType.BASIC,
              username: authData.userId.toString(),
              password: authData.apiKey,
            },
            queryParams: {
              max: '10',
              include_canceled: 'false' // Only show active appointments
            }
          });

          if (response.body.status === 'success') {
            return {
              disabled: false,
              options: response.body.data.map(appointment => ({
                label: `${appointment.calendar} - ${new Date(appointment.datetime).toLocaleString()}`,
                value: appointment.id.toString()
              }))
            };
          }
          return {
            disabled: true,
            options: [],
            placeholder: 'No active appointments found'
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Could not fetch appointments. Check your authentication.'
          };
        }
      }
    }),
    webhookInstructions: Property.MarkDown({
      value: `
      ## AcuityScheduling Webhook Setup
      To use this trigger, you need to manually set up a webhook in your AcuityScheduling account:
      1. Login to your AcuityScheduling account.
      2. Navigate to **Settings** > **Webhooks**.
      3. Enter the following URL in the webhooks field:
      \`\`\`text
      {{webhookUrl}}
      \`\`\`
      4. Select "Appointment Canceled" as the event type.
      5. Click Save to register the webhook.
      
      **Note:** The webhook will trigger for all canceled appointments unless you specify an appointment above.
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
    "appointment_id": "apt_12345",
    "status": "canceled",
    "title": "Annual Checkup",
    "datetime": "2025-08-15T09:00:00Z",
    "enddatetime": "2025-08-15T10:00:00Z",
    "client": {
      "id": "cli_67890",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1232324327"
    },
    "canceledAt": "2025-08-14T14:30:00Z",
    "canceledBy": "client",
    "cancelationReason": "Scheduling conflict"
  },

  async onEnable(context) {
    // No need to register webhooks programmatically as user will do it manually
    return Promise.resolve();
  },

  async onDisable(context) {
    // No need to unregister webhooks as user will do it manually
    return Promise.resolve();
  },

  async run(context) {
    const appointment_id = context.propsValue.appointment_id;
    const response = await httpClient.sendRequest<{ data: Array<Record<string, any>> }>({
      url: `${BASE_URL}/appointments/${appointment_id}/cancel`,
      method: HttpMethod.PUT,
      queryParams: {
        status: 'canceled',
        limit: '1'
      },
      authentication: {
        type: AuthenticationType.BASIC,
        username: context.auth.userId.toString(),
        password: context.auth.apiKey,
      },
    });

    if (response.body.data && response.body.data.length > 0) {
      return [response.body.data[0]];
    }

    return [context.propsValue];
  },
});