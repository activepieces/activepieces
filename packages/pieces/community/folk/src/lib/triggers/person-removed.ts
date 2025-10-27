import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkWebhook, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const personRemovedTrigger = createTrigger({
  auth: folkAuth,
  name: 'person_removed',
  displayName: 'Person Removed',
  description: 'Triggers when a person is deleted from the workspace or removed from a group',
  props: {
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'Specific group ID to monitor (leave empty to monitor all groups)',
      required: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'person_123456',
    type: 'person',
    name: 'John Doe',
    event: 'deleted',
    deleted_at: '2025-01-02T00:00:00Z',
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    const webhookData = {
      url: webhookUrl,
      events: ['person.deleted', 'person.removed_from_group'],
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
    
    if (payload.type === 'person' && (payload.event === 'deleted' || payload.event === 'removed_from_group')) {
      const data = payload.data;
      
      // Filter by group if specified
      if (context.propsValue.groupId && payload.event === 'removed_from_group') {
        if (payload.group_id !== context.propsValue.groupId) {
          return [];
        }
      }
      
      return [
        {
          data: {
            person: data,
            event: payload.event,
            group_id: payload.group_id,
          },
        },
      ];
    }

    return [];
  },
});
