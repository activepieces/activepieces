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

export const personUpdated = createTrigger({
  auth: folkAuth,
  name: 'person-updated',
  displayName: 'Person Updated',
  description: "Triggers when a person's basic field (e.g., name, job title, email, or URL) in a group is updated",
  props: {},
  sampleData: {
    id: 'per_8c18c158-d49e-4ad4-90d4-2b197688bac7',
    firstName: 'Jane',
    lastName: 'Smith',
    fullName: 'Jane Smith',
    updatedFields: {
      jobTitle: {
        oldValue: 'Product Manager',
        newValue: 'Senior Product Manager'
      },
      emails: {
        oldValue: [
          {
            email: 'jane.smith@acme.com',
            type: 'work',
            isPrimary: true
          }
        ],
        newValue: [
          {
            email: 'jane.smith@acme.com',
            type: 'work',
            isPrimary: true
          },
          {
            email: 'jane@example.com',
            type: 'personal',
            isPrimary: false
          }
        ]
      }
    },
    updatedAt: '2024-10-28T12:00:00.000Z',
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
        },
        {
          email: 'jane@example.com',
          type: 'personal',
          isPrimary: false
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
      addresses: [
        {
          street: '456 Business Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
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
        name: `Activepieces - Person Updated (${context.webhookUrl})`,
        targetUrl: context.webhookUrl,
        subscribedEvents: [
          {
            eventType: 'person.updated',
            filter: {}
          }
        ]
      }
    });

    await context.store.put('_person_updated_webhook_id', {
      webhookId: webhookResponse.data.id
    });
  },
  async onDisable(context) {
    const webhookData = await context.store.get<{ webhookId: string }>('_person_updated_webhook_id');
    
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