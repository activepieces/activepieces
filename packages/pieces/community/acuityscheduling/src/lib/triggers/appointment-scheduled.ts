import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { acuityschedulingAuth } from '../../index';
import { BASE_URL } from '../../index';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const appointmentRescheduledTrigger = createTrigger({
  auth: acuityschedulingAuth,
  name: 'appointment_rescheduled',
  displayName: 'Appointment Rescheduled',
  description: 'Triggers when an appointment is rescheduled',
  props: {
    appointment_id: Property.Dropdown({
      displayName: 'Appointment to Monitor',
      description: 'Select an appointment to monitor for rescheduling (leave blank for all appointments)',
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
              firstName?: string;
              lastName?: string;
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
              upcoming: 'true' // Only show upcoming appointments
            }
          });

          if (response.body.status === 'success') {
            return {
              disabled: false,
              options: response.body.data.map(appointment => ({
                label: `${appointment.calendar} - ${appointment.firstName || ''} ${appointment.lastName || ''} (${new Date(appointment.datetime).toLocaleString()})`,
                value: appointment.id.toString()
              }))
            };
          }
          return {
            disabled: true,
            options: [],
            placeholder: 'No upcoming appointments found'
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
      To use this trigger, manually set up a webhook in your AcuityScheduling account:
      1. Go to **Settings** > **Webhooks**
      2. Enter this URL:
      \`\`\`text
      {{webhookUrl}}
      \`\`\`
      3. Select "Appointment Rescheduled" as the event type
      4. Click Save to activate the webhook

      **Note:** If no specific appointment is selected above, the trigger will activate for ALL rescheduled appointments.
      `,
    }),
    include_client_details: Property.Checkbox({
      displayName: 'Include Client Details',
      description: 'Fetch and include full client details in the trigger payload',
      required: false,
      defaultValue: true
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    event_type: "appointment.rescheduled",
    data: {
      id: "12345",
      oldStartTime: "2023-10-01T10:00:00Z",
      newStartTime: "2023-10-01T11:00:00Z"
    }
  },
  async onEnable() {
    // Webhook registration is manual per instructions
    return Promise.resolve();
  },

  async onDisable() {
    // Webhook cleanup is manual per instructions
    return Promise.resolve();
  },

  async run(context) {
    const { appointment_id } = context.propsValue;

    try {
      const response = await httpClient.sendRequest<{
        data: Array<{
          id: string;
          oldStartTime: string;
          newStartTime: string;
        }>;
      }>({
        url: `${BASE_URL}/appointments/${appointment_id}/reschedule`,
        method: HttpMethod.PUT,
        authentication: {
          type: AuthenticationType.BASIC,
          username: context.auth.userId.toString(),
          password: context.auth.apiKey,
        },
      });

      if (response.body.data && response.body.data.length > 0) {
        return [{
          event_type: "appointment.rescheduled",
          data: response.body.data[0]
        }];
      }
    } catch (error) {
      console.error('Failed to reschedule:', error);
    }

    return [context.propsValue];
  },
});