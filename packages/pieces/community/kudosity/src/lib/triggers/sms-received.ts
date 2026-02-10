import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { kudosityAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
export const smsReceived = createTrigger({
  auth: kudosityAuth,
  name: 'smsReceived',
  displayName: 'SMS received',
  description: 'Triggered when an inbound SMS is received',
  props: {},
  sampleData: {
    event_type: 'SMS_INBOUND',
    timestamp: '2021-05-06T05:16:33.345678Z',
    webhook_id: 'fd0e6485-b905-44c1-bd55-fee1d0d6d864',
    webhook_name: 'SMS Inbound Webhook',
    mo: {
      type: 'SMS',
      id: 'alss-2way-605b31c7-d2c49104',
      message: 'Stop',
      recipient: '61481074190',
      routed_via: '447507333300',
      sender: '447507222200',
      last_message: {
        type: 'SMS',
        id: 'a51ebe4e-a412-440e-a8d9-464e68a521cc',
        message: 'Hey, check this out!',
        message_ref: 'ncc5009d',
        recipient: '447507222200',
        routed_via: '447507333300',
        sender: '61481074190',
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    const apiKey = context.auth.secret_text;

    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.transmitmessage.com/v2/webhook',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: {
        name: 'ActivePieces SMS Inbound Webhook',
        filter: {
          event_type: ['SMS_INBOUND'],
        },
        url: webhookUrl,
      },
    });

    const webhookId = res.body.id;
    await context.store.put('webhookId', webhookId);
  },
  async onDisable(context) {
    const apiKey = context.auth.secret_text;
    const storedWebhookId = await context.store.get('webhookId');

    if (storedWebhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.transmitmessage.com/v2/webhook/${storedWebhookId}`,
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });
    }
    await context.store.delete('webhookId');
  },
  async run(context) {
    const body = context.payload.body as any;
    if (body.event_type !== 'SMS_INBOUND') {
      return [];
    }
    return [context.payload.body];
  },
});
