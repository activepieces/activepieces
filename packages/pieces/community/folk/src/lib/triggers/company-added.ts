import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

interface WebhookResponse {
  data: {
    id: string;
    name: string;
    targetUrl: string;
    subscribedEvents: Array<{
      eventType: string;
      filter: Record<string, unknown>;
    }>;
    status: string;
    createdAt: string;
  };
}

export const companyAdded = createTrigger({
  auth: folkAuth,
  name: 'company-added',
  displayName: 'Company Added',
  description: 'Triggers when a new company is created or added to a group',
  props: {},
  sampleData: {
    id: 'cmp_8c18c158-d49e-4ad4-90d4-2b197688bac7',
    name: 'Acme Corporation',
    description: 'A leading technology company',
    industry: 'Technology',
    employeeRange: '51-200',
    foundationYear: '2015',
    fundingRaised: 5000000,
    lastFundingDate: '2024-03-15',
    createdAt: '2024-10-28T09:00:00.000Z',
    updatedAt: '2024-10-28T09:00:00.000Z',
    groups: [
      {
        id: 'grp_12345',
        name: 'Prospects'
      }
    ],
    emails: [
      {
        email: 'contact@acme.com',
        type: 'work',
        isPrimary: true
      }
    ],
    phones: [
      {
        phone: '+1-555-0123',
        type: 'work',
        isPrimary: true
      }
    ],
    urls: [
      {
        url: 'https://acme.com',
        type: 'website',
        isPrimary: true
      }
    ],
    addresses: [
      {
        street: '123 Main Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'US',
        isPrimary: true
      }
    ]
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookResponse = await folkApiCall<WebhookResponse>({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/webhooks',
      body: {
        name: `Activepieces - Company Added (${context.webhookUrl})`,
        targetUrl: context.webhookUrl,
        subscribedEvents: [
          {
            eventType: 'company.created',
            filter: {}
          }
        ]
      }
    });

    await context.store.put('_company_added_webhook_id', {
      webhookId: webhookResponse.data.id
    });
  },
  async onDisable(context) {
    const webhookData = await context.store.get<{ webhookId: string }>('_company_added_webhook_id');
    
    if (webhookData?.webhookId) {
      try {
        await folkApiCall({
          apiKey: context.auth,
          method: HttpMethod.DELETE,
          endpoint: `/webhooks/${webhookData.webhookId}`
        });
      } catch (error) {
        // Webhook might already be deleted, continue silently
        console.error('Error deleting webhook:', error);
      }
    }
  },
  async run(context) {
    return [context.payload.body];
  }
});