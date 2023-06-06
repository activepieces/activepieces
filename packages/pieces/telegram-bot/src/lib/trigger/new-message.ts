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