import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { MollieAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const newInvoice = createTrigger({
  auth: MollieAuth,
  name: 'newInvoice',
  displayName: 'New Invoice',
  description: 'Fires when a new invoice is generated in Mollie',
  props: {},
  sampleData: {
    resource: 'invoice',
    id: 'inv_xBEbP9rvAq',
    reference: 'INV-2023-0001',
    vatNumber: 'NL123456789B01',
    status: 'open',
    issuedAt: '2023-01-15',
    paidAt: null,
    dueAt: '2023-02-14',
    netAmount: {
      value: '100.00',
      currency: 'EUR',
    },
    vatAmount: {
      value: '21.00',
      currency: 'EUR',
    },
    grossAmount: {
      value: '121.00',
      currency: 'EUR',
    },
    lines: [
      {
        period: '2023-01',
        description: 'Transaction costs',
        count: 42,
        vatPercentage: 21,
        amount: {
          value: '100.00',
          currency: 'EUR',
        },
      },
    ],
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/invoices/inv_xBEbP9rvAq',
        type: 'application/hal+json',
      },
      pdf: {
        href: 'https://api.mollie.com/v2/invoices/inv_xBEbP9rvAq/pdf',
        type: 'application/pdf',
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookData = {
      url: context.webhookUrl,
      events: ['sales-invoice.created'],
      description: 'New Invoice Webhook',
    };

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/webhooks',
      webhookData
    );

    await context.store?.put('_webhook_id', response.id);
  },
  async onDisable(context) {
    const webhookId = await context.store?.get('_webhook_id');

    if (webhookId) {
      try {
        await makeRequest(
          context.auth.access_token,
          HttpMethod.DELETE,
          `/webhooks/${webhookId}`
        );
      } catch (error) {
          
        console.warn('Failed to delete webhook:', error);

      }
    }
  },
  async run(context) {
    const payload = context.payload.body as { resource?: string };

    if (payload && payload.resource === 'invoice') {
      return [payload];
    }

    return [];
  },
});
