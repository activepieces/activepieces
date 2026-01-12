import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { kudosityAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stat } from 'fs';
export const smsSent = createTrigger({
  auth: kudosityAuth,
  name: 'smsSent',
  displayName: 'SMS Sent',
  description: 'Triggered when an SMS sent',
  props: {},
  sampleData: {
    event_type: 'SMS_STATUS',
    timestamp: '2025-04-23T00:05:18.123456Z',
    webhook_id: 'fd0e6485-b905-44c1-bd55-fee1d0d6d864',
    webhook_name: 'SMS Status Webhook',
    status: {
      id: 'e48d3e71-264e-4afb-9c06-edec1f0bb9d4',
      type: 'SMS',
      message_ref: 'test V2 QA SMS Send',
      sender: '447507222200',
      routed_via: '6140000000',
      recipient: '6140000000',
      status: 'SENT',
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
        name: 'ActivePieces SMS Sent Webhook',
        filter: {
          event_type: ['SMS_STATUS'],
          status: ['SENT'],
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
    if (body.event_type !== 'SMS_STATUS' && body.status.status !== 'SENT') {
      return [];
    }
    return [context.payload.body];
  },
});
