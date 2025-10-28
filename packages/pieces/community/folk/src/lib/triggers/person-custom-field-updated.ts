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

export const personCustomFieldUpdated = createTrigger({
  auth: folkAuth,
  name: 'person-custom-field-updated',
  displayName: 'Person Custom Field Updated',
  description: 'Triggers when a person custom field (e.g., tag, status, text, assignee) is updated',
  props: {},
  sampleData: {
    id: 'per_8c18c158-d49e-4ad4-90d4-2b197688bac7',
    firstName: 'Jane',
    lastName: 'Smith',
    fullName: 'Jane Smith',
    customFieldUpdates: {
      fieldId: 'cf_54321',
      fieldName: 'Lead Status',
      fieldType: 'status',
      oldValue: 'New Lead',
      newValue: 'Qualified',
      groupId: 'grp_12345',
      groupName: 'Sales Pipeline'
    },
    updatedAt: '2024-10-28T12:30:00.000Z',
    updatedBy: {
      id: 'usr_98765',
      name: 'John Doe',
      email: 'john@example.com'
    },
    person: {
      id: 'per_8c18c158-d49e-4ad4-90d4-2b197688bac7',
      firstName: 'Jane',
      lastName: 'Smith',
      fullName: 'Jane Smith',
      bio: 'Senior Product Manager at Acme Corporation',
      jobTitle: 'Senior Product Manager',
      emails: [
        {
          email: 'jane.smith@acme.com',
          type: 'work',
          isPrimary: true
        }
      ],
      phones: [
        {
          phone: '+1-555-0456',
          type: 'work',
          isPrimary: true
        }
      ],
      urls: [
        {
          url: 'https://linkedin.com/in/janesmith',
          type: 'linkedin',
          isPrimary: true
        }
      ],
      companies: [
        {
          id: 'cmp_98765',
          name: 'Acme Corporation',
          role: 'Senior Product Manager'
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
        name: `Activepieces - Person Custom Field Updated (${context.webhookUrl})`,
        targetUrl: context.webhookUrl,
        subscribedEvents: [
          {
            eventType: 'person.customFieldUpdated',
            filter: {}
          }
        ]
      }
    });

    await context.store.put('_person_custom_field_updated_webhook_id', {
      webhookId: webhookResponse.data.id
    });
  },
  async onDisable(context) {
    const webhookData = await context.store.get<{ webhookId: string }>('_person_custom_field_updated_webhook_id');
    
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