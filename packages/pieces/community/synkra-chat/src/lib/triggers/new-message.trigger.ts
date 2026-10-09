import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { synkraChatAuth } from '../auth';
import { synkraChatRequest } from '../common/client';

const TRIGGER_KEY = 'synkra-chat-new-message';

export const newMessageTrigger = createTrigger({
  auth: synkraChatAuth,
  name: 'new_message',
  displayName: 'New Message',
  description: 'Triggers whenever a message is created in a conversation.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    message_type: Property.StaticDropdown({
      displayName: 'Message Direction',
      description: 'Which messages to fire on.',
      required: true,
      defaultValue: 'incoming',
      options: {
        options: [
          { label: 'Incoming (from customer)', value: 'incoming' },
          { label: 'Outgoing (from agent)', value: 'outgoing' },
          { label: 'Both', value: 'both' },
        ],
      },
    }),
  },
  sampleData: {
    event: 'message_created',
    id: 12345,
    content: 'Hi, I need help with my order',
    message_type: 'incoming',
    created_at: '2026-09-30T11:22:33Z',
    sender: { id: 101, name: 'Jane Smith', email: 'jane@example.com', type: 'contact' },
    conversation: { id: 42, inbox_id: 1, status: 'open' },
    account: { id: 3, name: 'Acme Inc' },
    inbox: { id: 1, name: 'Website Chat' },
  },
  async onEnable(context) {
    const result = await synkraChatRequest<{ id: number }>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/webhooks',
      body: {
        url: context.webhookUrl,
        name: 'Synkra Flow',
        subscriptions: ['message_created'],
      },
    });
    await context.store.put<number>(TRIGGER_KEY, result.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<number>(TRIGGER_KEY);
    if (webhookId) {
      await synkraChatRequest({
        auth: context.auth.props,
        method: HttpMethod.DELETE,
        path: `/webhooks/${webhookId}`,
      }).catch(() => {
        // Webhook may already be gone.
      });
    }
  },
  async run(context) {
    const body = context.payload.body as { event?: string; message_type?: string } | undefined;
    if (!body || body.event !== 'message_created') {
      return [];
    }
    const filter = (context.propsValue.message_type as string) ?? 'incoming';
    if (filter !== 'both' && body.message_type !== filter) {
      return [];
    }
    return [body];
  },
  async test(context) {
    return [context.payload.body];
  },
});
