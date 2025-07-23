import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeAuth, systemeCommon } from '../common';

interface SaleCustomer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface SaleProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
}

interface SaleData {
  id: string;
  customer: SaleCustomer;
  products: SaleProduct[];
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  funnelId?: string;
  funnelName?: string;
  createdAt: string;
  updatedAt?: string;
}

interface SaleWebhookPayload {
  event: string;
  sale: SaleData;
  timestamp?: string;
}

interface WebhookResponse {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt?: string;
}

export const newSaleTrigger = createTrigger({
  auth: systemeAuth,
  name: 'new_sale',
  displayName: 'New Sale',
  description: 'Fires when a new purchase is made within a funnel in your Systeme.io account',
  props: {},
  sampleData: {
    event: "order.completed",
    sale: {
      id: "order_12345",
      customer: {
        id: "12345",
        email: "john.doe@example.com",
        firstName: "John",
        lastName: "Doe",
        phone: "+1234567890"
      },
      products: [
        {
          id: "prod_123",
          name: "Digital Course",
          price: 99.99,
          currency: "USD",
          quantity: 1
        }
      ],
      totalAmount: 99.99,
      currency: "USD",
      paymentStatus: "paid",
      funnelId: "funnel_123",
      funnelName: "Sales Funnel",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z"
    },
    timestamp: "2024-01-15T10:30:00Z"
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    try {
      const webhookData = {
        url: context.webhookUrl,
        events: ['order.completed', 'subscription.created'],
        active: true,
      };

      const webhook = await systemeCommon.makeRequestWithAuth<WebhookResponse>(
        context.auth,
        HttpMethod.POST,
        '/webhooks',
        webhookData
      );

      await context.store.put('systeme_new_sale_webhook', {
        webhookId: webhook.id,
        url: webhook.url,
        events: webhook.events,
      });

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to register new sale webhook: ${error.message}`);
      }
      throw new Error('Failed to register new sale webhook: Unknown error occurred');
    }
  },
  async onDisable(context) {
    try {
      const webhook = await context.store.get<{ webhookId: string; url: string; events: string[] }>('systeme_new_sale_webhook');
      if (webhook?.webhookId) {
        await systemeCommon.makeRequestWithAuth<void>(
          context.auth,
          HttpMethod.DELETE,
          `/webhooks/${webhook.webhookId}`
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Failed to unregister new sale webhook:', errorMessage);
    }
  },
  async run(context) {
    const payload = context.payload.body as SaleWebhookPayload;
    
    if (!payload || typeof payload !== 'object') {
      console.warn('Invalid webhook payload received');
      return [];
    }

    const validEvents = ['order.completed', 'subscription.created'];
    if (!validEvents.includes(payload.event)) {
      console.warn(`Unexpected event type: ${payload.event}`);
      return [];
    }

    if (!payload.sale || !payload.sale.id || !payload.sale.customer?.email) {
      console.warn('Invalid sale data in webhook payload');
      return [];
    }

    if (!Array.isArray(payload.sale.products) || payload.sale.products.length === 0) {
      console.warn('Invalid products data in webhook payload');
      return [];
    }

    return [payload];
  },
}); 