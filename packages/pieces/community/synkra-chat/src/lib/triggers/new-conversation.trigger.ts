import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { synkraChatAuth } from '../auth';
import { synkraChatRequest } from '../common/client';

const TRIGGER_KEY = 'synkra-chat-new-conversation';

export const newConversationTrigger = createTrigger({
  auth: synkraChatAuth,
  name: 'new_conversation',
  displayName: 'New Conversation',
  description: 'Triggers whenever a new conversation is started.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    event: 'conversation_created',
    id: 42,
    inbox_id: 1,
    status: 'open',
    contact: { id: 101, name: 'Jane Smith', email: 'jane@example.com' },
    account: { id: 3, name: 'Acme Inc' },
  },
  async onEnable(context) {
    const result = await synkraChatRequest<{ id: number }>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/webhooks',
      body: {
        url: context.webhookUrl,
        name: 'Synkra Flow',
        subscriptions: ['conversation_created'],
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
      }).catch(() => {});
    }
  },
  async run(context) {
    const body = context.payload.body as { event?: string } | undefined;
    if (!body || body.event !== 'conversation_created') return [];
    return [body];
  },
  async test(context) {
    return [context.payload.body];
  },
});
