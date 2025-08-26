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

export const subscriptionInvoicePaid = createTrigger({
  name: 'subscription_invoice_paid',
  displayName: 'Subscription Invoice Paid',
  description: 'Fires when a subscription invoice is paid',
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
        public_id: "lineXYZ",
        invoice_id: 9,
        external_id: null,
        payment_type: "subscription",
        description: "Monthly Subscription",
        quantity: 1,
        fulfillment_status: "complete",
        external_product_id: "prod_123",
        discount_amount: 0.00,
        state_tax_amount: 0.50,
        county_tax_amount: 0.25,
        city_tax_amount: 0.15,
        district_tax_amount: 0.10,
        state_tax_rate: 0.05,
        county_tax_rate: 0.025,
        city_tax_rate: 0.015,
        district_tax_rate: 0.01,
        country_tax_jurisdiction: "US",
        state_tax_jurisdiction: "CA",
        county_tax_jurisdiction: "Orange",
        city_tax_jurisdiction: "Irvine",
        period_start_at: "2025-06-16T00:00:00.000Z",
        period_end_at: "2025-07-16T00:00:00.000Z",
        period_number: "1",
        created_at: "2025-06-16T20:25:45.895Z",
        updated_at: "2025-06-16T20:25:45.895Z",
        amount: "9.99",
        products_price: {},
        products_variant: {}
      }
    ],
    order: {}
  },

  onEnable: async (context) => {
    const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
    const webhookUrl = context.webhookUrl;
    
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://${subdomain}.myclickfunnels.com/api/v2/webhooks/outgoing/endpoints`,
      body: {
        endpoint: {
          name: 'Activepieces Subscription Invoice Paid',
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
      // Check if this is a paid invoice with required fields
      if (invoiceData.id && invoiceData.status === 'paid' && invoiceData.order_id && invoiceData.paid_at) {
        // Filter for subscription-related invoices if line items indicate subscription
        const hasSubscriptionItems = invoiceData.line_items?.some((item: any) => 
          item.payment_type === 'subscription' || 
          item.period_start_at || 
          item.period_end_at ||
          item.period_number
        );
        
        if (hasSubscriptionItems) {
          return [invoiceData];
        }
      }
    }
    
    // Fallback for direct invoice structure
    if (payload && payload.id && payload.status === 'paid' && payload.order_id && payload.paid_at) {
      const hasSubscriptionItems = payload.line_items?.some((item: any) => 
        item.payment_type === 'subscription' || 
        item.period_start_at || 
        item.period_end_at ||
        item.period_number
      );
      
      if (hasSubscriptionItems) {
        return [payload];
      }
    }
    
    return [];
  },
});
