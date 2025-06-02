import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { crispAuth } from '../common/common';
import { crispClient } from '../common/client';

export const conversationStatusChanged = createTrigger({
  auth: crispAuth,
  name: 'conversation_status_changed',
  displayName: 'Conversation Status Changed',
  description: 'Triggers when a conversation status changes (resolved/unresolved)',
  props: {
    websiteId: Property.ShortText({
      displayName: 'Website ID',
      required: true
    }),
    status: Property.StaticDropdown({
      displayName: 'Status to watch for',
      required: true,
      options: {
        options: [
          { label: 'Resolved', value: 'resolved' },
          { label: 'Unresolved', value: 'unresolved' },
          { label: 'Any Change', value: 'any' }
        ]
      }
    })
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    "id": "session_abc123",
    "website_id": "website_xyz456",
    "status": "resolved",
    "changed_at": "2023-07-15T10:05:00Z",
    "meta": {
      "email": "customer@example.com"
    }
  },
  onEnable: async (context) => {
    const conversations = await crispClient.getConversations(
      context.auth.access_token, 
      context.propsValue.websiteId,
    );
    await context.store.put('lastStatusCheck', {
      id: conversations[0]?.id || '',
      status: conversations[0]?.status || ''
    });
  },
  onDisable: async () => {},
  run: async (context) => {
    const lastCheck = (await context.store.get('lastStatusCheck')) as { id: string, status: string } || { id: '', status: '' };
    const conversations = await crispClient.getConversations(
      context.auth.access_token,
      context.propsValue.websiteId,
    );

    const changedConversations = [];
    let newLastId = lastCheck.id;
    let newLastStatus = lastCheck.status;

    for (const conversation of conversations) {
      if (conversation.id === lastCheck.id) break;

      if (conversation.status !== lastCheck.status) {
        if (context.propsValue.status === 'any' || 
            conversation.status === context.propsValue.status) {
          changedConversations.push(conversation);
        }
      }

      if (!newLastId) {
        newLastId = conversation.id;
        newLastStatus = conversation.status;
      }
    }

    if (changedConversations.length > 0 || newLastId !== lastCheck.id) {
      await context.store.put('lastStatusCheck', {
        id: newLastId,
        status: newLastStatus
      });
    }

    return changedConversations;
  }
});