import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkPerson, FolkWebhook, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const personUpdatedTrigger = createTrigger({
  auth: folkAuth,
  name: 'person_updated',
  displayName: 'Person Updated',
  description: 'Triggers when a person\'s basic field (e.g., name, job title, email, or URL) in a group is updated',
  props: {
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'Specific group ID to monitor',
      required: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'person_123456',
    type: 'person',
    name: 'John Doe',
    first_name: 'John',
    last_name: 'Doe',
    emails: ['john.doe@example.com'],
    job_title: 'CEO',
    updated_fields: ['job_title', 'emails'],
    updated_at: '2025-01-02T00:00:00Z',
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    const webhookData = {
      url: webhookUrl,
      events: ['person.updated'],
      active: true,
    };

    const response = await makeFolkRequest<{ webhook: FolkWebhook }>(
      context.auth,
      HttpMethod.POST,
      '/webhooks',
      webhookData
    );

    await context.store.put('webhookId', response.webhook.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhookId');
    
    if (webhookId) {
      await makeFolkRequest(
        context.auth,
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
      await context.store.delete('webhookId');
    }
  },
  async run(context) {
    const payload = context.payload.body as any;
    
    if (payload.type === 'person' && payload.event === 'updated') {
      const person = payload.data as FolkPerson;
      
      // Filter by group if specified
      if (context.propsValue.groupId) {
        if (!person.groups?.includes(context.propsValue.groupId)) {
          return [];
        }
      }
      
      return [
        {
          data: {
            person,
            updated_fields: payload.updated_fields,
            updated_at: payload.updated_at,
          },
        },
      ];
    }

    return [];
  },
});