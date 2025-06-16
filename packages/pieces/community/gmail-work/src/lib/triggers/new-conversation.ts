import { createTrigger, TriggerStrategy, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../index';
import { gmailCommon } from '../common/common';


export const newConversation = createTrigger({
  auth: gmailAuth,
  name: 'new_conversation',
  displayName: 'New Conversation',
  description: 'Triggers when a new email conversation (thread) begins',
  props: {
    labelFilter: Property.Dropdown({
      displayName: 'Label Filter',
      description: 'Only trigger for emails with this label (optional)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };
        
        try {
            const authData = auth as OAuth2PropertyValue;
          const response = await gmailCommon.getLabels(authData.access_token);
          return {
            options: [
              { label: 'All Labels', value: '' },
              ...response.labels.map((label: any) => ({
                label: label.name,
                value: label.id,
              })),
            ],
          };
        } catch (error) {
          return { options: [] };
        }
      },
    }),
  },
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await context.store.put('lastChecked', new Date().toISOString());
  },
  onDisable: async (context) => {
    await context.store.delete('lastChecked');
  },
  run: async (context) => {
    const lastChecked = await context.store.get('lastChecked') as string;
    const checkTime = lastChecked ? new Date(lastChecked) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    let query = `after:${Math.floor(checkTime.getTime() / 1000)}`;
    if (context.propsValue.labelFilter) {
      query += ` label:${context.propsValue.labelFilter}`;
    }
    
    const response = await gmailCommon.makeRequest(
      context.auth.access_token,
      'GET',
      `/users/me/threads?q=${encodeURIComponent(query)}&maxResults=50`
    );
    
    if (!response.threads) {
      await context.store.put('lastChecked', new Date().toISOString());
      return [];
    }
    
    // Filter for new conversations (threads with only one message)
    const newConversations = [];
    for (const thread of response.threads) {
      const threadDetail = await gmailCommon.getThread(context.auth.access_token, thread.id);
      if (threadDetail.messages && threadDetail.messages.length === 1) {
        newConversations.push(threadDetail);
      }
    }
    
    await context.store.put('lastChecked', new Date().toISOString());
    
    return newConversations.map(thread => ({
      id: thread.id,
      historyId: thread.historyId,
      messages: thread.messages,
      firstMessage: thread.messages[0],
    }));
  },
  sampleData: {
    id: 'sample_thread_id',
    historyId: 'sample_history_id',
    messages: [
      {
        id: 'sample_message_id',
        threadId: 'sample_thread_id',
        labelIds: ['INBOX'],
        snippet: 'This is the start of a new conversation...',
        payload: {
          headers: [
            { name: 'From', value: 'sender@example.com' },
            { name: 'Subject', value: 'New Conversation' },
            { name: 'Date', value: 'Mon, 16 Jun 2025 10:00:00 +0000' },
          ],
        },
      },
    ],
  },
});