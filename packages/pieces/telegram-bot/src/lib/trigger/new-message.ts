import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { telegramCommons } from "../common";

export const telegramNewMessage = createTrigger({
    name: 'new_telegram_message',
    displayName: 'New message',
    description: 'Triggers when Telegram receives a new message',
    props: {
        bot_token: telegramCommons.bot_token,
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        "body": {
          "message": {
            "chat": {
              "id": 55169542059,
              "type": "private",
              "username": "AbdallahAlwarawreh",
              "last_name": "Alwarawreh",
              "first_name": "Abdallah"
            },
            "date": 1686050152,
            "from": {
              "id": 55169542059,
              "is_bot": false,
              "username": "AbdallahAlwarawreh",
              "last_name": "Alwarawreh",
              "first_name": "Abdallah",
              "language_code": "en"
            },
            "text": "Hello world",
            "message_id": 21
          },
          "update_id": 351114420
        }
    },
    async onEnable(context) {
        await telegramCommons.subscribeWebhook(
            context.propsValue['bot_token'],
            context.webhookUrl,
        );
    },
    async onDisable(context) {
        await telegramCommons.unsubscribeWebhook(
            context.propsValue['bot_token'],
        );
    },
    async run(context) {
        return [context.payload.body];
    },
    async test(context) {
        return [context.payload.body];
    },
});