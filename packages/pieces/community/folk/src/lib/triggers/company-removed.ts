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

export const companyRemoved = createTrigger({
  auth: folkAuth,
  name: 'company-removed',
  displayName: 'Company Removed',
  description: 'Triggers when a company is deleted from the workspace or removed from a group',
  props: {},
  sampleData: {
    id: 'cmp_8c18c158-d49e-4ad4-90d4-2b197688bac7',
    name: 'Acme Corporation',
    deletionType: 'deleted', // or 'removed_from_group'
    removedAt: '2024-10-28T10:00:00.000Z',
    removedBy: {
      id: 'usr_98765',
      name: 'John Doe',
      email: 'john@example.com'
    },
    group: {
      id: 'grp_12345',
      name: 'Prospects'
    },
    company: {
      id: 'cmp_8c18c158-d49e-4ad4-90d4-2b197688bac7',
      name: 'Acme Corporation',
      description: 'A leading technology company',
      industry: 'Technology',
      employeeRange: '51-200',
      emails: [
        {
          email: 'contact@acme.com',
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
        name: `Activepieces - Company Removed (${context.webhookUrl})`,
        targetUrl: context.webhookUrl,
        subscribedEvents: [
          {
            eventType: 'company.deleted',
            filter: {}
          }
        ]
      }
    });

    await context.store.put('_company_removed_webhook_id', {
      webhookId: webhookResponse.data.id
    });
  },
  async onDisable(context) {
    const webhookData = await context.store.get<{ webhookId: string }>('_company_removed_webhook_id');
    
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