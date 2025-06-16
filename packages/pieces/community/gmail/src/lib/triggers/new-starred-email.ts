import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../index';
import { gmailCommon } from '../common/common';

export const newStarredEmail = createTrigger({
  auth: gmailAuth,
  name: 'new_starred_email',
  displayName: 'New Starred Email',
  description: 'Triggers when an email is starred (within 2 days)',
  props: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    // Store the current timestamp as the last check time
    await context.store.put('lastChecked', new Date().toISOString());
  },
  onDisable: async (context) => {
    await context.store.delete('lastChecked');
  },
  run: async (context) => {
    const lastChecked = await context.store.get('lastChecked') as string;
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const checkTime = lastChecked ? new Date(lastChecked) : twoDaysAgo;
    
    const query = `is:starred after:${Math.floor(checkTime.getTime() / 1000)}`;
    
    const response = await gmailCommon.makeRequest(
      context.auth.access_token,
      'GET',
      `/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`
    );
    
    if (!response.messages) {
      await context.store.put('lastChecked', new Date().toISOString());
      return [];
    }
    
    const detailedMessages = await Promise.all(
      response.messages.map(async (msg: any) => {
        return gmailCommon.getMessage(context.auth.access_token, msg.id);
      })
    );
    
    await context.store.put('lastChecked', new Date().toISOString());
    
    return detailedMessages.map(msg => ({
      id: msg.id,
      threadId: msg.threadId,
      ...msg,
    }));
  },
  sampleData: {
    id: 'sample_message_id',
    threadId: 'sample_thread_id',
    labelIds: ['STARRED', 'INBOX'],
    snippet: 'This is a sample starred email...',
    payload: {
      headers: [
        { name: 'From', value: 'sender@example.com' },
        { name: 'Subject', value: 'Important Email' },
        { name: 'Date', value: 'Mon, 16 Jun 2025 10:00:00 +0000' },
      ],
    },
  },
});