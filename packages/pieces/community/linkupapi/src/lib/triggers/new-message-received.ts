import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { linkupAuth, linkupPost, linkupDelete, accountIdProp } from '../common';

const STORE_KEY = '_linkup_new_message_webhook_id';

export const newMessageReceived = createTrigger({
  auth: linkupAuth,
  name: 'new_message_received',
  displayName: 'New Message Received',
  description:
    'Fires in real time when the connected LinkedIn account receives a new message. Registers a LinkupAPI webhook (≈10 credits/day per monitored account while active).',
  type: TriggerStrategy.WEBHOOK,
  props: {
    accountId: accountIdProp,
  },
  sampleData: {
    timestamp: '2026-06-17T12:00:00Z',
    event: {
      type: 'message',
      account_id: 'your-account-id',
      data: {
        conversation_id: '2-abc123',
        sender_profile_url: 'https://www.linkedin.com/in/janedoe',
        message_text: 'Hi, thanks for connecting!',
      },
      timestamp: '2026-06-17T11:59:58Z',
    },
  },
  async onEnable(context) {
    const res = await linkupPost<{ data?: { webhook_id?: string } }>(
      context.auth.secret_text,
      '/webhooks',
      {
        account_id: context.propsValue.accountId,
        url: context.webhookUrl,
        events: ['message_received'],
      }
    );
    if (res?.data?.webhook_id) {
      await context.store.put<string>(STORE_KEY, res.data.webhook_id);
    }
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>(STORE_KEY);
    if (webhookId) {
      await linkupDelete(context.auth.secret_text, `/webhooks/${webhookId}`);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
