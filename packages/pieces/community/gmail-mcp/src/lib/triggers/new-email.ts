import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { gmailMcpAuth } from '../common/auth';
import { gmailRequest } from '../common/gmail-api';

export const newEmailTrigger = createTrigger({
  auth: gmailMcpAuth,
  name: 'gmail_mcp_new_email',
  displayName: 'New Email Received',
  description: 'Triggers when a new email is received in Gmail',
  props: {
    label: Property.ShortText({ displayName: 'Label Filter', required: false }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: '18f1234abcd',
    threadId: '18f1234abcd',
    snippet: 'Hello, this is a sample email...',
    from: 'sender@example.com',
    subject: 'Sample Email',
    date: '2025-01-01T00:00:00Z',
  },
  async onEnable(context) {
    const messages: any = await gmailRequest(context.auth.access_token, HttpMethod.GET, '/messages?maxResults=1');
    if (messages?.messages?.[0]) {
      await context.store.put('lastMessageId', messages.messages[0].id);
    }
  },
  async onDisable(context) {
    await context.store.delete('lastMessageId');
  },
  async run(context) {
    const lastId = await context.store.get<string>('lastMessageId');
    let query = 'is:unread';
    if (context.propsValue.label) query += ` label:${context.propsValue.label}`;
    const messages: any = await gmailRequest(context.auth.access_token, HttpMethod.GET, `/messages?q=${encodeURIComponent(query)}&maxResults=20`);
    if (!messages?.messages) return [];
    const newMessages = [];
    for (const msg of messages.messages) {
      if (msg.id === lastId) break;
      const full: any = await gmailRequest(context.auth.access_token, HttpMethod.GET, `/messages/${msg.id}?format=full`);
      newMessages.push(full);
    }
    if (messages.messages.length > 0) await context.store.put('lastMessageId', messages.messages[0].id);
    return newMessages.map((m: any) => ({ data: m, epochMilliSeconds: Date.now() }));
  },
  async test(context) {
    const messages: any = await gmailRequest(context.auth.access_token, HttpMethod.GET, '/messages?maxResults=3');
    if (!messages?.messages) return [];
    const results = [];
    for (const msg of messages.messages) {
      const full: any = await gmailRequest(context.auth.access_token, HttpMethod.GET, `/messages/${msg.id}?format=full`);
      results.push(full);
    }
    return results.map((m: any) => ({ data: m, epochMilliSeconds: Date.now() }));
  },
});
