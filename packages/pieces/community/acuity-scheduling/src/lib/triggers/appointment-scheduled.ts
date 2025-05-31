import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuityAuth } from '../../index';

export const appointmentScheduledTrigger = createTrigger({
  auth: acuityAuth,
  name: 'appointment_scheduled',
  displayName: 'Appointment Scheduled',
  description: 'Triggers when a new appointment is scheduled',
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    action: 'scheduled',
    id: '123456789',
    calendarID: '1',
    appointmentTypeID: '1',
    firstName: 'Krushna',
    lastName: 'Rout',
    email: 'testuser@gmail,com',
    phone: '555-1234',
    date: '2025-06-01',
    time: '10:00 AM',
    datetime: '2025-06-01T10:00:00-0500',
    endTime: '11:00 AM',
    datetimeCreated: '2025-06-25T09:30:00-0500',
    price: '100.00',
    paid: 'yes',
    status: 'scheduled',
    noShow: false,
  },
  props: {},

  async onEnable(context) {
    await context.store.put('appointment_scheduled_webhook_url', {
      webhookUrl: context.webhookUrl,
    });
  },

  async onDisable(context) {
    await context.store.delete('appointment_scheduled_webhook_url');
  },

  async run(context) {
    const payload = context.payload.body as {
      action: string;
      id: string;
      [key: string]: any;
    };

    if (payload.action !== 'scheduled') {
      return [];
    }

    const appointmentId = payload.id;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://acuityscheduling.com/api/v1/appointments/${appointmentId}`,
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${context.auth.userId}:${context.auth.apiKey}`
        ).toString('base64')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    return [response.body];
  },
});
