import { clickfunnelsAuth } from '../common/auth';
import { clickfunnelsCommon } from '../common/client';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';

export const oneTimeOrderPaid = createTrigger({
  name: 'one_time_order_paid',
  displayName: 'One-Time Order Paid',
  description: 'Fires when a customer pays a one-time order invoice',
  auth: clickfunnelsAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 9,
    public_id: "aeIHDh",
    order_id: 31,
    status: "paid",
    due_amount: "0.00",
    total_amount: "9.99",
    subtotal_amount: "9.99",
    tax_amount: "9.99",
    shipping_amount: "9.99",
    discount_amount: "9.99",
    currency: "USD",
    issued_at: "2025-06-16T20:25:45.000Z",
    due_at: "2025-07-23T20:25:45.000Z",
    paid_at: "2025-07-09T20:25:45.000Z",
    invoice_type: null,
    invoice_number: "99",
    fulfillment_status: "not_applicable",
    created_at: "2025-06-16T20:25:45.895Z",
    updated_at: "2025-06-16T20:25:45.895Z",
    external_id: null,
    payment_processor: "payments_ai",
    eligible_for_fulfillment: true,
    line_items: [
      {
        id: 16,
        public_id: "example_line_item",
        invoice_id: 9,
        external_id: "ext_123",
        payment_type: "one_time",
        description: "Product Purchase",
        quantity: 1,
        fulfillment_status: "unfulfilled",
        amount: "9.99"
      }
    ],
    order: {
      id: 31,
      public_id: "order_public_id",
      workspace_id: 42000
    }
  },

  onEnable: async (context) => {
    const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
    const webhookUrl = context.webhookUrl;
    
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://${subdomain}.myclickfunnels.com/api/v2/webhooks/outgoing/endpoints`,
      body: {
        endpoint: {
          name: 'Activepieces One-Time Order Paid',
          url: webhookUrl,
          event_type_ids: ['orders.invoice.paid']
        }
      },
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await httpClient.sendRequest(request);
    if (response.status !== 201) {
      throw new Error(`Failed to register webhook. Status: ${response.status}`);
    }

    const webhookId = response.body.data?.id || response.body.id;
    await context.store?.put('webhookId', webhookId);
  },

  onDisable: async (context) => {
    const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
    const webhookId = await context.store?.get('webhookId');
    
    if (!webhookId) {
      return;
    }

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `https://${subdomain}.myclickfunnels.com/api/v2/webhooks/outgoing/endpoints/${webhookId}`,
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
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
    
    if (payload?.data) {
      const invoiceData = payload.data;
      if (invoiceData.id && invoiceData.status === 'paid' && invoiceData.order_id && invoiceData.paid_at) {
        const hasOneTimeItems = invoiceData.line_items?.some((item: any) => 
          item.payment_type === 'one_time' || 
          (!item.period_start_at && !item.period_end_at && !item.period_number)
        );
        
        if (hasOneTimeItems || !invoiceData.line_items || invoiceData.line_items.length === 0) {
          return [invoiceData];
        }
      }
    }
    
    if (payload && payload.id && payload.status === 'paid' && payload.order_id && payload.paid_at) {
      const hasOneTimeItems = payload.line_items?.some((item: any) => 
        item.payment_type === 'one_time' || 
        (!item.period_start_at && !item.period_end_at && !item.period_number)
      );
      
      if (hasOneTimeItems || !payload.line_items || payload.line_items.length === 0) {
        return [payload];
      }
    }
    
    return [];
  },
});
