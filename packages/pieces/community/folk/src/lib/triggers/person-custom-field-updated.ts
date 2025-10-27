import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkWebhook, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const personCustomFieldUpdatedTrigger = createTrigger({
  auth: folkAuth,
  name: 'person_custom_field_updated',
  displayName: 'Person Custom Field Updated',
  description: 'Triggers when a person custom field (e.g., tag, status, text, assignee) is updated',
  props: {
    fieldKey: Property.ShortText({
      displayName: 'Field Key',
      description: 'Specific custom field key to monitor (leave empty to monitor all custom fields)',
      required: false,
    }),
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
    custom_field_key: 'status',
    old_value: 'Lead',
    new_value: 'Customer',
    updated_at: '2025-01-02T00:00:00Z',
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    const webhookData = {
      url: webhookUrl,
      events: ['person.custom_field_updated'],
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
    
    if (payload.type === 'person' && payload.event === 'custom_field_updated') {
      // Filter by field key if specified
      if (context.propsValue.fieldKey) {
        if (payload.field_key !== context.propsValue.fieldKey) {
          return [];
        }
      }
      
      // Filter by group if specified
      if (context.propsValue.groupId) {
        if (!payload.data.groups?.includes(context.propsValue.groupId)) {
          return [];
        }
      }
      
      return [
        {
          data: {
            person: payload.data,
            field_key: payload.field_key,
            old_value: payload.old_value,
            new_value: payload.new_value,
            updated_at: payload.updated_at,
          },
        },
      ];
    }

    return [];
  },
});