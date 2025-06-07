import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { crispAuth } from '../common/common';
import { crispClient } from '../common/client';

export const newConversation = createTrigger({
  auth: crispAuth, 
  name: 'new_conversation',
  displayName: 'New Conversation Created',
  description: 'Triggers when a new conversation is started in Crisp',
  props: {
    websiteId: Property.ShortText({
      displayName: 'Website ID',
      required: true,
      description: 'The website ID from your Crisp settings'
    }),
    includeMetadata: Property.Checkbox({
      displayName: 'Include Full Metadata',
      description: 'Fetch complete conversation data (slower)',
      required: false,
      defaultValue: false
    })
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    "id": "session_abc123",
    "website_id": "website_xyz456",
    "created_at": "2023-07-15T10:00:00Z",
    "updated_at": "2023-07-15T10:00:00Z",
    "meta": {
      "email": "customer@example.com",
      "nickname": "John Doe"
    }
  },
  onEnable: async (context) => {
    const conversations = await crispClient.getConversations(
      context.auth, 
      context.propsValue.websiteId,
    );
    await context.store.put('lastConversationId', conversations[0]?.id || '');
  },
  onDisable: async () => {},
  run: async (context) => {
    const lastId = (await context.store.get('lastConversationId')) as string || '';
    const conversations = await crispClient.getConversations(
      context.auth,
      context.propsValue.websiteId,
    );

    const newConversations = [];
    let stop = false;

    for (const conversation of conversations) {
      if (conversation.id === lastId) {
        stop = true;
        break;
      }
      if (context.propsValue.includeMetadata) {
        const fullData = await crispClient.getConversation(
          context.auth,
          context.propsValue.websiteId,
          conversation.id
        );
        newConversations.push(fullData);
      } else {
        newConversations.push(conversation);
      }
    }

    if (newConversations.length > 0) {
      await context.store.put('lastConversationId', newConversations[0].id);
      return newConversations.reverse();
    }
    return [];
  }
});