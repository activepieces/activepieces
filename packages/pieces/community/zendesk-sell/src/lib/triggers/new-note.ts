import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, Note } from '../common/common';
import { zendeskSellAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';

export const newNoteTrigger = createTrigger({
  auth: zendeskSellAuth,
  name: 'new_note',
  displayName: 'New Note',
  description: 'Fires when a new note is added to a record (lead, contact, deal)',
  props: {
    resourceType: Property.StaticDropdown({
      displayName: 'Resource Type',
      description: 'Type of resource to monitor for notes',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Lead', value: 'lead' },
          { label: 'Contact', value: 'contact' },
          { label: 'Deal', value: 'deal' },
        ],
      },
      defaultValue: 'all',
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 1,
    content: 'Follow-up call completed successfully',
    resource_type: 'deal',
    resource_id: 100,
    creator_id: 10,
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    const webhookData = {
      data: {
        target_url: webhookUrl,
        resource_type: 'note',
        event_type: 'created',
        active: true,
      },
    };

    const response = await makeZendeskSellRequest<{ data: { id: number } }>(
      context.auth,
      HttpMethod.POST,
      '/webhooks',
      webhookData
    );

    await context.store.put('webhookId', response.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<number>('webhookId');
    
    if (webhookId) {
      await makeZendeskSellRequest(
        context.auth,
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
      await context.store.delete('webhookId');
    }
  },
  async run(context) {
    const payload = context.payload.body as any;
    
    if (payload.data && payload.meta?.type === 'note') {
      const note = payload.data as Note;
      
      // Filter by resource type if specified
      if (context.propsValue.resourceType === 'all' || 
          note.resource_type === context.propsValue.resourceType) {
        return [
          {
            data: {
              note: note,
            },
          },
        ];
      }
    }

    return [];
  },
});