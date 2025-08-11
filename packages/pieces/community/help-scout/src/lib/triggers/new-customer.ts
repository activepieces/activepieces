import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { helpScoutAuth } from '../common/auth';
import crypto from 'crypto';
import { helpScoutApiRequest, verifyWebhookSignature } from '../common/api';
import { HttpMethod } from '@activepieces/pieces-common';

const WEBHOOK_KEY = 'helpscout_new_customer';

export const newCustomer = createTrigger({
  auth: helpScoutAuth,
  name: 'new_customer',
  displayName: 'New Customer',
  description: 'Triggers when a new customer is added.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {},
  async onEnable(context) {
    const secret = crypto.randomBytes(20).toString('hex');

    const response = await helpScoutApiRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      url: '/webhooks',
      body: {
        url: context.webhookUrl,
        events: ['customer.created'],
        secret,
      },
    });

    const webhookId = response.headers?.['resource-id'] as string;

    await context.store.put<{ webhookId: string; WebhookSecret: string }>(
      WEBHOOK_KEY,
      { webhookId: webhookId, WebhookSecret: secret }
    );
  },
  async onDisable(context) {
    const webhookData = await context.store.get<{
      webhookId: string;
      WebhookSecret: string;
    }>(WEBHOOK_KEY);
    if (webhookData?.webhookId) {
      await helpScoutApiRequest({
        method: HttpMethod.DELETE,
        url: `/webhooks/${webhookData.webhookId}`,
        auth: context.auth,
      });
    }
  },
  async run(context) {
    const webhookData = await context.store.get<{
      webhookId: string;
      WebhookSecret: string;
    }>(WEBHOOK_KEY);

    const webhookSecret = webhookData?.WebhookSecret;
    const webhookSignatureHeader =
      context.payload.headers['x-helpscout-signature'];
    const rawBody = context.payload.rawBody;

    if (
      !verifyWebhookSignature(webhookSecret, webhookSignatureHeader, rawBody)
    ) {
      return [];
    }

    return [context.payload.body];
  },
  async test(context) {
    const response = await helpScoutApiRequest({
      method: HttpMethod.GET,
      url: '/customers ',
      auth: context.auth,
    });

    const { _embedded } = response.body as {
      _embedded: {
        customers: { id: number }[];
      };
    };

    return _embedded.customers;
  },
});
