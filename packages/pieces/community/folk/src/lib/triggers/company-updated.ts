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

export const companyUpdated = createTrigger({
  auth: folkAuth,
  name: 'company-updated',
  displayName: 'Company Updated',
  description: "Triggers when a company's basic field (e.g., name, email, or URL) in a group is updated",
  props: {},
  sampleData: {
    id: 'cmp_8c18c158-d49e-4ad4-90d4-2b197688bac7',
    name: 'Acme Corporation',
    updatedFields: {
      name: {
        oldValue: 'Acme Corp',
        newValue: 'Acme Corporation'
      },
      emails: {
        oldValue: [
          {
            email: 'info@acme.com',
            type: 'work',
            isPrimary: true
          }
        ],
        newValue: [
          {
            email: 'contact@acme.com',
            type: 'work',
            isPrimary: true
          }
        ]
      }
    },
    updatedAt: '2024-10-28T10:30:00.000Z',
    updatedBy: {
      id: 'usr_98765',
      name: 'John Doe',
      email: 'john@example.com'
    },
    company: {
      id: 'cmp_8c18c158-d49e-4ad4-90d4-2b197688bac7',
      name: 'Acme Corporation',
      description: 'A leading technology company',
      industry: 'Technology',
      employeeRange: '51-200',
      foundationYear: '2015',
      fundingRaised: 5000000,
      lastFundingDate: '2024-03-15',
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
    }
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookResponse = await folkApiCall<WebhookResponse>({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/webhooks',
      body: {
        name: `Activepieces - Company Updated (${context.webhookUrl})`,
        targetUrl: context.webhookUrl,
        subscribedEvents: [
          {
            eventType: 'company.updated',
            filter: {}
          }
        ]
      }
    });

    await context.store.put('_company_updated_webhook_id', {
      webhookId: webhookResponse.data.id
    });
  },
  async onDisable(context) {
    const webhookData = await context.store.get<{ webhookId: string }>('_company_updated_webhook_id');
    
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