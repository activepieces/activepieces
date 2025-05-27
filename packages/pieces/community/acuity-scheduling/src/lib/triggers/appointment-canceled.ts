import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuityAuth } from '../../index';

export const appointmentCanceledTrigger = createTrigger({
  auth: acuityAuth,
  name: 'appointment_canceled',
  displayName: 'Appointment Canceled',
  description: 'Triggers when an appointment is canceled',
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    action: 'canceled',
    id: '123456789',
    calendarID: '1',
    appointmentTypeID: '1',
    firstName: 'Krushna',
    lastName: 'Rout',
    email: 'testuser@gmail.com',
    phone: '555-5678',
    date: '2025-06-05',
    time: '02:00 PM',
    datetime: '2025-06-05T14:00:00-0500',
    endTime: '03:00 PM',
    datetimeCreated: '2025-06-05T10:15:00-0500',
    price: '75.00',
    paid: 'no',
    status: 'canceled',
    noShow: false,
  },
  props: {},

  async onEnable(context) {
    await context.store.put('appointment_canceled_webhook_url', {
      webhookUrl: context.webhookUrl,
    });
  },

  async onDisable(context) {
    await context.store.delete('appointment_canceled_webhook_url');
  },

  async run(context) {
  const payload = context.payload.body as {
    action: string;
    id: string;
    [key: string]: any;
  };

  if (payload.action !== 'canceled') {
    return [];
  }

  const appointmentId = payload.id;

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `https://acuityscheduling.com/api/v1/appointments/${appointmentId}`,
    headers: {
      Authorization: `Basic ${Buffer.from(`${context.auth.userId}:${context.auth.apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  return [response.body];
}
});
