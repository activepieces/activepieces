import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkPerson, FolkWebhook, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const personAddedTrigger = createTrigger({
  auth: folkAuth,
  name: 'person_added',
  displayName: 'Person Added',
  description: 'Triggers when a new person is created or added to a group',
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
    first_name: 'John',
    last_name: 'Doe',
    emails: ['john.doe@example.com'],
    job_title: 'CEO',
    groups: ['group_abc'],
    custom_fields: {},
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  async onEnable(context) {
    
  },
  async onDisable(context) {
    
  },
  async run(context) {
    const payload = context.payload.body as any;
    
    if (payload.type === 'person' && (payload.event === 'created' || payload.event === 'added_to_group')) {
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
            event: payload.event,
          },
        },
      ];
    }

    return [];
  },
});
