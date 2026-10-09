import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { synkraChatAuth } from '../auth';
import { synkraChatRequest } from '../common/client';

const TRIGGER_KEY = 'synkra-chat-new-contact';

export const newContactTrigger = createTrigger({
  auth: synkraChatAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers whenever a new contact is created.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    event: 'contact_created',
    id: 101,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone_number: '+27123456789',
  },
  async onEnable(context) {
    const result = await synkraChatRequest<{ id: number }>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/webhooks',
      body: {
        url: context.webhookUrl,
        name: 'Synkra Flow',
        subscriptions: ['contact_created'],
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
    if (!body || body.event !== 'contact_created') return [];
    return [body];
  },
  async test(context) {
    return [context.payload.body];
  },
});
