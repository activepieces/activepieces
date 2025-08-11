import { teamleaderAuth } from '../common/auth';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { teamleaderCommon } from '../common/client';

export const newInvoice = createTrigger({
  name: 'new_invoice',
  displayName: 'New Invoice',
  description: 'Triggers when a new invoice is drafted',
  auth: teamleaderAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: '12345678-abcd-1234-5678-1234567890gh',
    invoice_number: '2025 / 001',
    invoice_date: '2025-01-15',
    status: 'draft',
    due_on: '2025-02-14',
    paid: false,
    paid_at: null,
    sent: false,
    purchase_order_number: 'PO-2025-001',
    payment_reference: '+++084/2613/66074+++',
    invoicee: {
      type: 'company',
      id: '12345678-abcd-1234-5678-1234567890ef'
    },
    department: {
      type: 'department',
      id: '45985439-58ce-02df-2542-9dfe87ee1a39'
    },
    total: {
      amount: 2500.00,
      currency: 'EUR'
    },
    currency_exchange_rate: {
      from: 'EUR',
      to: 'EUR',
      rate: 1.0
    },
    deal: {
      type: 'deal',
      id: '12345678-abcd-1234-5678-1234567890cd'
    },
    project: null,
    created_at: '2025-01-15T10:30:00+00:00',
    updated_at: '2025-01-15T10:30:00+00:00',
    web_url: 'https://focus.teamleader.eu/invoice_detail.php?id=12345678-abcd-1234-5678-1234567890gh'
  },
  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${teamleaderCommon.baseUrl}/webhooks.register`,
      body: {
        url: webhookUrl,
        types: ['invoice.drafted']
      },
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    const { status } = await httpClient.sendRequest(request);
    if (status !== 204) {
      throw new Error(`Failed to register webhook. Status: ${status}`);
    }
  },
  onDisable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${teamleaderCommon.baseUrl}/webhooks.unregister`,
      body: {
        url: webhookUrl,
        types: ['invoice.drafted']
      },
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      await httpClient.sendRequest(request);
    } catch (error) {
      console.warn('Failed to unregister webhook:', error);
    }
  },
  run: async (context) => {
    const payload = context.payload.body as any;
    
    if (payload?.id) {
      try {
        const invoiceDetails = await teamleaderCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.POST,
          resourceUri: '/invoices.info',
          body: { id: payload.id }
        });
        
        return [invoiceDetails.body.data];
      } catch (error) {
        return [payload];
      }
    }
    
    return [payload];
  },
});
