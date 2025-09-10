import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mollieCommon } from '../common';
import { mollieAuth } from '../../index';

const TRIGGER_KEY = 'mollie_new_invoice_webhook';

export const mollieNewInvoice = createTrigger({
  auth: mollieAuth,
  name: 'new_invoice',
  displayName: 'New Invoice',
  description: 'Fires when a new invoice is generated',

  type: TriggerStrategy.WEBHOOK,

  props: {},

  sampleData: {
    id: 'inv_FrvewDA3Pr',
    resource: 'invoice',
    reference: 'INV-2024-001',
    vatNumber: 'NL123456789B01',
    status: 'open',
    issuedAt: '2024-01-15T09:00:00+00:00',
    paidAt: null,
    dueAt: '2024-02-14T09:00:00+00:00',
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
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/invoices/inv_FrvewDA3Pr',
        type: 'application/hal+json',
      },
      pdf: {
        href: 'https://api.mollie.com/v2/invoices/inv_FrvewDA3Pr.pdf',
        type: 'application/pdf',
      },
    },
  },

  async onEnable(context) {
    const webhookUrl = context.webhookUrl;

    const webhookData = {
      name: 'Activepieces Invoice Webhook',
      url: webhookUrl,
      eventTypes: 'sales-invoice.created',
    };

    const response = await mollieCommon.makeRequest(
      context.auth as string,
      HttpMethod.POST,
      '/webhooks',
      webhookData
    );

    const webhook = response as { id: string };
    await context.store.put<string>(TRIGGER_KEY, webhook.id);
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>(TRIGGER_KEY);

    if (webhookId) {
      try {
        await mollieCommon.makeRequest(
          context.auth as string,
          HttpMethod.DELETE,
          `/webhooks/${webhookId}`
        );
      } catch (error) {
        console.warn(`Failed to delete Mollie webhook ${webhookId}:`, error);
      }
    }

    await context.store.delete(TRIGGER_KEY);
  },

  async run(context) {
    const payload = context.payload.body as {
      id: string;
    };

    if (payload.id) {
      try {
        const invoice = await mollieCommon.makeRequest(
          context.auth as string,
          HttpMethod.GET,
          `/invoices/${payload.id}`
        );

        return [invoice];
      } catch (error) {
        return [payload];
      }
    }

    return [];
  },

  async test(context) {
    try {
      const response = await mollieCommon.makeRequest(
        context.auth as string,
        HttpMethod.GET,
        '/invoices?limit=1'
      );

      const invoices = response as {
        _embedded?: { invoices?: Record<string, unknown>[] };
      };

      if (invoices._embedded?.invoices?.length) {
        return invoices._embedded.invoices;
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    }

    return [
      {
        id: 'inv_FrvewDA3Pr',
        resource: 'invoice',
        reference: 'INV-2024-001',
        vatNumber: 'NL123456789B01',
        status: 'open',
        issuedAt: '2024-01-15T09:00:00+00:00',
        paidAt: null,
        dueAt: '2024-02-14T09:00:00+00:00',
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
        _links: {
          self: {
            href: 'https://api.mollie.com/v2/invoices/inv_FrvewDA3Pr',
            type: 'application/hal+json',
          },
          pdf: {
            href: 'https://api.mollie.com/v2/invoices/inv_FrvewDA3Pr.pdf',
            type: 'application/pdf',
          },
        },
      },
    ];
  },
});
