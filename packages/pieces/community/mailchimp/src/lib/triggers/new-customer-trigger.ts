import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mail_chimp_new_customer_webhook_data';

type WebhookData = {
  id: string;
  listId: string;
};

const getNewCustomerEventSummary = (request: any): any => {
  const data = request.data || {};
  return {
    customer_id: data.customer_id || data.id || 'N/A',
    store_id: data.store_id || 'N/A',
    email: data.email || 'N/A',
    first_name: data.first_name || 'N/A',
    last_name: data.last_name || 'N/A',
    company: data.company || 'N/A',
    phone: data.phone || 'N/A',
    address: data.address || 'N/A',
    created_at: data.created_at || request.fired_at || 'N/A',
    customer_type: data.customer_type || 'new',
    has_orders: data.orders_count > 0,
    total_spent: data.total_spent || 0,
    orders_count: data.orders_count || 0,
  };
};

const extractCustomerAddress = (address: any): any => {
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

const assessCustomerValue = (data: any): string => {
  const totalSpent = data.total_spent || 0;
  const ordersCount = data.orders_count || 0;
  
  if (totalSpent >= 1000 || ordersCount >= 10) return 'High Value';
  if (totalSpent >= 100 || ordersCount >= 3) return 'Medium Value';
  return 'New Customer';
};

const identifyCustomerOpportunities = (data: any): string[] => {
  const opportunities = [];
  
  if (data.orders_count === 0) {
    opportunities.push('First-time customer - welcome series opportunity');
  }
  
  if (data.total_spent > 0) {
    opportunities.push('Returning customer - loyalty program opportunity');
  }
  
  if (data.company) {
    opportunities.push('Business customer - B2B marketing opportunity');
  }
  
  if (data.address) {
    opportunities.push('Geographic targeting opportunity');
  }
  
  return opportunities.length > 0 ? opportunities : ['Standard customer onboarding'];
};

const assessMarketingPotential = (data: any): string => {
  if (data.opt_in_status && data.member_rating >= 4) {
    return 'High - Opted in with high engagement';
  }
  if (data.opt_in_status) {
    return 'Medium - Opted in for marketing';
  }
  if (data.company) {
    return 'Medium - Business customer potential';
  }
  return 'Low - Limited marketing consent';
};

export const mailChimpNewCustomerTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'new_customer',
  displayName: 'New Customer',
  description: 'Fires when a new customer is added to a connected store',
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
  },
  sampleData: {
    type: 'customer',
    fired_at: '2024-01-15T10:30:00Z',
    data: {
      id: 'customer_123',
      customer_id: 'customer_123',
      store_id: 'store_456',
      email: 'customer@example.com',
      first_name: 'John',
      last_name: 'Doe',
      company: 'Example Corp',
      phone: '+1-555-0123',
      address: {
        address1: '123 Main St',
        address2: 'Suite 100',
        city: 'Anytown',
        province: 'California',
        province_code: 'CA',
        postal_code: '12345',
        country: 'United States',
        country_code: 'US',
      },
      created_at: '2024-01-15T10:30:00Z',
      customer_type: 'new',
      orders_count: 0,
      total_spent: 0,
      opt_in_status: true,
      tags: ['new-customer', 'ecommerce'],
      member_rating: 5,
      vip: false,
    },
  },

  async onEnable(context): Promise<void> {
    try {
      const accessToken = getAccessTokenOrThrow(context.auth);
      const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

      const enabledWebhookId = await mailchimpCommon.enableWebhookRequest({
        server,
        listId: context.propsValue.list_id as string,
        token: accessToken,
        webhookUrl: context.webhookUrl!,
        events: { 
          customer: true,
        },
      });

      await context.store?.put<WebhookData>(WEBHOOK_DATA_STORE_KEY, {
        id: enabledWebhookId,
        listId: context.propsValue.list_id as string,
      });
    } catch (error: any) {
      throw new Error(`Failed to enable new customer webhook: ${error.message || JSON.stringify(error)}`);
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
        listId: webhookData.listId,
        webhookId: webhookData.id,
      });
    } catch (error: any) {
      console.error(`Failed to disable new customer webhook: ${error.message || JSON.stringify(error)}`);
    }
  },

  async run(context): Promise<unknown[]> {
    try {
      const request = context.payload.body as any;

      if (!request || request.type !== 'customer') {
        return [];
      }

      const enhancedRequest = {
        ...request,
        trigger_type: 'new_customer',
        event_category: 'Customer Registration',
        processed_at: new Date().toISOString(),
        customer_summary: getNewCustomerEventSummary(request),
        business_context: {
          customer_acquisition: true,
          ecommerce_tracking: true,
          onboarding_automation: true,
          customer_segmentation: true,
        },
        customer_insights: {
          customer_value: assessCustomerValue(request.data),
          address_details: extractCustomerAddress(request.data?.address),
          automation_opportunities: identifyCustomerOpportunities(request.data),
          marketing_potential: assessMarketingPotential(request.data),
        },
      };

      return [enhancedRequest];
    } catch (error: any) {
      console.error(`Error processing new customer webhook: ${error.message || JSON.stringify(error)}`);
      return [];
    }
  },
});
