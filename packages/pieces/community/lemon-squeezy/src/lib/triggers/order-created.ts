import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { lemonSqueezyAuth, LEMON_SQUEEZY_API_BASE, getLemonSqueezyHeaders } from '../auth';
import crypto from 'crypto';

interface LemonSqueezyWebhookResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      url: string;
      signing_secret: string;
      events: string[];
    };
  };
}

interface StoredWebhook {
  id: string;
  secret: string;
}

function verifyLemonSqueezySignature(secret: string, rawBody: string, signatureHeader: string): boolean {
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signatureHeader, 'hex'));
  } catch {
    return false;
  }
}

export const orderCreated = createTrigger({
  auth: lemonSqueezyAuth,
  name: 'order_created',
  displayName: 'Order Created',
  description: 'Triggers in real time whenever a new order is placed in your Lemon Squeezy store.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    meta: {
      test_mode: false,
      event_name: 'order_created',
      webhook_id: 'abc123',
    },
    data: {
      type: 'orders',
      id: '12345',
      attributes: {
        store_id: 1,
        identifier: 'f7e2d-abc123',
        order_number: 1001,
        user_name: 'John Doe',
        user_email: 'john@example.com',
        currency: 'USD',
        currency_rate: '1.00000',
        subtotal: 999,
        discount_total: 0,
        tax: 0,
        total: 999,
        subtotal_usd: 999,
        discount_total_usd: 0,
        tax_usd: 0,
        total_usd: 999,
        tax_name: '',
        tax_rate: '0.00',
        status: 'paid',
        status_formatted: 'Paid',
        refunded: false,
        refunded_at: null,
        subtotal_formatted: '$9.99',
        discount_total_formatted: '$0.00',
        tax_formatted: '$0.00',
        total_formatted: '$9.99',
        first_order_item: {
          id: 67890,
          order_id: 12345,
          product_id: 111,
          variant_id: 222,
          product_name: 'My Digital Product',
          variant_name: 'Default',
          price: 999,
          created_at: '2024-01-15T10:30:00.000000Z',
          updated_at: '2024-01-15T10:30:00.000000Z',
          deleted_at: null,
          test_mode: false,
        },
        created_at: '2024-01-15T10:30:00.000000Z',
        updated_at: '2024-01-15T10:30:00.000000Z',
      },
    },
  },
  async onEnable(context) {
    const webhookName = `Activepieces — Order Created (${Date.now()})`;

    // Fetch all stores and register a webhook on each one
    const storesResponse = await httpClient.sendRequest<{ data: Array<{ id: string }> }>({
      method: HttpMethod.GET,
      url: `${LEMON_SQUEEZY_API_BASE}/stores`,
      headers: getLemonSqueezyHeaders(context.auth as string),
    });

    const stores = storesResponse.body.data;
    if (!stores || stores.length === 0) {
      throw new Error('No stores found in your Lemon Squeezy account.');
    }

    // Generate a cryptographically random secret for HMAC verification
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Register on the first store (users with multiple stores can add more triggers per store)
    const storeId = stores[0].id;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${LEMON_SQUEEZY_API_BASE}/webhooks`,
      headers: getLemonSqueezyHeaders(context.auth as string),
      body: {
        data: {
          type: 'webhooks',
          attributes: {
            url: context.webhookUrl,
            events: ['order_created'],
            secret: webhookSecret,
            name: webhookName,
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId,
              },
            },
          },
        },
      },
    };

    const response = await httpClient.sendRequest<LemonSqueezyWebhookResponse>(request);

    // Store both the webhook ID (for deletion) and the secret (for signature verification)
    await context.store.put<StoredWebhook>('lemon_squeezy_webhook_order_created', {
      id: response.body.data.id,
      secret: webhookSecret,
    });
  },
  async onDisable(context) {
    const stored = await context.store.get<StoredWebhook>('lemon_squeezy_webhook_order_created');

    if (stored?.id) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${LEMON_SQUEEZY_API_BASE}/webhooks/${stored.id}`,
        headers: getLemonSqueezyHeaders(context.auth as string),
      });
    }
  },
  async run(context) {
    const stored = await context.store.get<StoredWebhook>('lemon_squeezy_webhook_order_created');
    const secret = stored?.secret;

    if (secret) {
      // Lemon Squeezy sends HMAC-SHA256 signature in the X-Signature header
      const signatureHeader = context.payload.headers['x-signature'] as string | undefined;
      const rawBody = context.payload.rawBody as string;

      if (!signatureHeader || !verifyLemonSqueezySignature(secret, rawBody, signatureHeader)) {
        return [];
      }
    }

    return [context.payload.body];
  },
});
