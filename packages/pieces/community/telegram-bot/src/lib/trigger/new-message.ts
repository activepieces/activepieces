import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramNewMessage = createTrigger({
  auth: telegramBotAuth,
  name: 'new_telegram_message',
  displayName: 'New message',
  description: 'Triggers when Telegram receives a new message',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    body: {
      message: {
        chat: {
          id: 55169542059,
          type: 'private',
          username: 'AbdallahAlwarawreh',
          last_name: 'Alwarawreh',
          first_name: 'Abdallah',
        },
        date: 1686050152,
        from: {
          id: 55169542059,
          is_bot: false,
          username: 'AbdallahAlwarawreh',
          last_name: 'Alwarawreh',
          first_name: 'Abdallah',
          language_code: 'en',
        },
        parse_mode: 'MarkdownV2',
        text: 'Hello world',
        message_id: 21,
      },
      update_id: 351114420,
    },
  },
  async onEnable(context) {
    await telegramCommons.subscribeWebhook(context.auth, context.webhookUrl, {
      allowed_updates: [],
    });
  },
  async onDisable(context) {
    await telegramCommons.unsubscribeWebhook(context.auth);
  },
  async run(context) {
    return [context.payload.body];
  }
});
