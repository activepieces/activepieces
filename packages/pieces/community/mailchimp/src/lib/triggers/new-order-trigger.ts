import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mail_chimp_new_order_webhook_data';

type WebhookData = {
  id: string;
  storeId: string;
};

const getNewOrderEventSummary = (request: any): any => {
  const data = request.data || {};
  return {
    order_id: data.order_id || data.id || 'N/A',
    store_id: data.store_id || 'N/A',
    customer_id: data.customer_id || 'N/A',
    customer_email: data.customer_email || 'N/A',
    order_total: data.order_total || 0,
    currency: data.currency || 'USD',
    order_status: data.order_status || 'pending',
    created_at: data.created_at || request.fired_at || 'N/A',
    items_count: data.items_count || 0,
    shipping_total: data.shipping_total || 0,
    tax_total: data.tax_total || 0,
    discount_total: data.discount_total || 0,
  };
};

const extractOrderItems = (items: any[]): any => {
  if (!items || !Array.isArray(items)) return [];
  
  return items.map(item => ({
    product_id: item.product_id || 'N/A',
    product_title: item.product_title || 'N/A',
    product_variant_id: item.product_variant_id || 'N/A',
    quantity: item.quantity || 1,
    price: item.price || 0,
    total: item.total || 0,
    category: item.category || 'N/A',
    tags: item.tags || [],
  }));
};

const extractOrderAddress = (address: any): any => {
  if (!address) return null;
  
  return {
    street_address: {
      primary: address.address1 || 'N/A',
      secondary: address.address2 || 'N/A',
    },
    city: address.city || 'N/A',
    state_province: {
      name: address.province || 'N/A',
      code: address.province_code || 'N/A',
    },
    postal_code: address.postal_code || 'N/A',
    country: {
      name: address.country || 'N/A',
      code: address.country_code || 'N/A',
    },
    full_address: [
      address.address1,
      address.address2,
      address.city,
      address.province,
      address.postal_code,
      address.country,
    ].filter(Boolean).join(', '),
  };
};

const assessOrderValue = (data: any): string => {
  const orderTotal = data.order_total || 0;
  
  if (orderTotal >= 500) return 'High Value';
  if (orderTotal >= 100) return 'Medium Value';
  if (orderTotal >= 50) return 'Standard Value';
  return 'Low Value';
};

const identifyOrderOpportunities = (data: any): string[] => {
  const opportunities = [];
  
  if (data.order_status === 'fulfilled') {
    opportunities.push('Order fulfilled - follow-up opportunity');
  }
  
  if (data.order_status === 'shipped') {
    opportunities.push('Order shipped - delivery tracking opportunity');
  }
  
  if (data.items_count > 1) {
    opportunities.push('Multiple items - cross-sell opportunity');
  }
  
  if (data.order_total > 100) {
    opportunities.push('High-value order - VIP treatment opportunity');
  }
  
  if (data.shipping_total > 0) {
    opportunities.push('Shipping paid - loyalty program opportunity');
  }
  
  return opportunities.length > 0 ? opportunities : ['Standard order processing'];
};

const calculateOrderMetrics = (data: any): any => {
  const orderTotal = data.order_total || 0;
  const shippingTotal = data.shipping_total || 0;
  const taxTotal = data.tax_total || 0;
  const discountTotal = data.discount_total || 0;
  
  return {
    subtotal: orderTotal - shippingTotal - taxTotal + discountTotal,
    net_revenue: orderTotal - discountTotal,
    profit_margin: orderTotal > 0 ? ((orderTotal - discountTotal) / orderTotal) * 100 : 0,
    average_item_value: data.items_count > 0 ? orderTotal / data.items_count : 0,
    shipping_percentage: orderTotal > 0 ? (shippingTotal / orderTotal) * 100 : 0,
  };
};

export const mailChimpNewOrderTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'new_order',
  displayName: 'New Order',
  description: 'Fires when a new order is created in the connected store',
  type: TriggerStrategy.WEBHOOK,
  props: {
    store_id: mailchimpCommon.mailChimpStoreIdDropdown,
  },
  sampleData: {
    type: 'order',
    fired_at: '2024-01-15T10:30:00Z',
    data: {
      id: 'order_123',
      order_id: 'order_123',
      store_id: 'store_456',
      customer_id: 'customer_789',
      customer_email: 'customer@example.com',
      order_total: 299.99,
      currency: 'USD',
      order_status: 'pending',
      created_at: '2024-01-15T10:30:00Z',
      items_count: 3,
      shipping_total: 15.99,
      tax_total: 24.00,
      discount_total: 25.00,
      items: [
        {
          product_id: 'prod_001',
          product_title: 'Premium Widget',
          product_variant_id: 'var_001',
          quantity: 2,
          price: 89.99,
          total: 179.98,
          category: 'Widgets',
          tags: ['premium', 'bestseller'],
        },
        {
          product_id: 'prod_002',
          product_title: 'Standard Widget',
          product_variant_id: 'var_002',
          quantity: 1,
          price: 119.99,
          total: 119.99,
          category: 'Widgets',
          tags: ['standard'],
        },
      ],
      shipping_address: {
        address1: '123 Main St',
        address2: 'Suite 100',
        city: 'Anytown',
        province: 'California',
        province_code: 'CA',
        postal_code: '12345',
        country: 'United States',
        country_code: 'US',
      },
      billing_address: {
        address1: '123 Main St',
        address2: 'Suite 100',
        city: 'Anytown',
        province: 'California',
        province_code: 'CA',
        postal_code: '12345',
        country: 'United States',
        country_code: 'US',
      },
      customer: {
        first_name: 'John',
        last_name: 'Doe',
        company: 'Example Corp',
        phone: '+1-555-0123',
      },
    },
  },

  async onEnable(context): Promise<void> {
    try {
      const accessToken = getAccessTokenOrThrow(context.auth);
      const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

      const enabledWebhookId = await mailchimpCommon.enableWebhookRequest({
        server,
        listId: context.propsValue.store_id!,
        token: accessToken,
        webhookUrl: context.webhookUrl!,
        events: { 
          order: true,
          customer: true,
        },
      });

      await context.store?.put<WebhookData>(WEBHOOK_DATA_STORE_KEY, {
        id: enabledWebhookId,
        storeId: context.propsValue.store_id!,
      });
    } catch (error: any) {
      throw new Error(`Failed to enable new order webhook: ${error.message || JSON.stringify(error)}`);
    }
  },

  async onDisable(context): Promise<void> {
    try {
      const webhookData = await context.store?.get<WebhookData>(WEBHOOK_DATA_STORE_KEY);

      if (webhookData === undefined || webhookData === null) {
        return;
      }

      const token = getAccessTokenOrThrow(context.auth);
      const server = await mailchimpCommon.getMailChimpServerPrefix(token);

      await mailchimpCommon.disableWebhookRequest({
        server,
        token,
        listId: webhookData.storeId,
        webhookId: webhookData.id,
      });
    } catch (error: any) {
      console.error(`Failed to disable new order webhook: ${error.message || JSON.stringify(error)}`);
    }
  },

  async run(context): Promise<unknown[]> {
    try {
      const request = context.payload.body as any;

      if (request === undefined || request.type !== 'order') {
        return [];
      }

      const enhancedRequest = {
        ...request,
        trigger_type: 'new_order',
        event_category: 'Order Creation',
        processed_at: new Date().toISOString(),
        order_summary: getNewOrderEventSummary(request),
        business_context: {
          order_management: true,
          ecommerce_tracking: true,
          revenue_tracking: true,
          customer_engagement: true,
        },
        order_insights: {
          order_value: assessOrderValue(request.data),
          order_items: extractOrderItems(request.data?.items),
          shipping_address: extractOrderAddress(request.data?.shipping_address),
          billing_address: extractOrderAddress(request.data?.billing_address),
          automation_opportunities: identifyOrderOpportunities(request.data),
          financial_metrics: calculateOrderMetrics(request.data),
        },
      };

      return [enhancedRequest];
    } catch (error: any) {
      console.error(`Error processing new order webhook: ${error.message || JSON.stringify(error)}`);
      return [];
    }
  },
});
