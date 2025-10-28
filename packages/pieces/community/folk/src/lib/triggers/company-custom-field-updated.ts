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

export const companyCustomFieldUpdated = createTrigger({
  auth: folkAuth,
  name: 'company-custom-field-updated',
  displayName: 'Company Custom Field Updated',
  description: 'Triggers when a company custom field (e.g., tag, status, text, assignee) is updated',
  props: {},
  sampleData: {
    id: 'cmp_8c18c158-d49e-4ad4-90d4-2b197688bac7',
    name: 'Acme Corporation',
    customFieldUpdates: {
      fieldId: 'cf_12345',
      fieldName: 'Deal Stage',
      fieldType: 'status',
      oldValue: 'Prospect',
      newValue: 'Qualified',
      groupId: 'grp_12345',
      groupName: 'Sales Pipeline'
    },
    updatedAt: '2024-10-28T09:30:00.000Z',
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
        name: `Activepieces - Company Custom Field Updated (${context.webhookUrl})`,
        targetUrl: context.webhookUrl,
        subscribedEvents: [
          {
            eventType: 'company.customFieldUpdated',
            filter: {}
          }
        ]
      }
    });

    await context.store.put('_company_custom_field_updated_webhook_id', {
      webhookId: webhookResponse.data.id
    });
  },
  async onDisable(context) {
    const webhookData = await context.store.get<{ webhookId: string }>('_company_custom_field_updated_webhook_id');
    
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