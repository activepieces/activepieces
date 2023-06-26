import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { telegramSendMessageAction } from './lib/action/send-text-message.action';
import { telegramNewMessage } from './lib/trigger/new-message';

const markdownDescription = `
Refer to the [Telegram piece documentation](https://activepieces.com/docs/pieces/apps/telegram) for more information on how to obtain the bot token.
`;

export const telegramBotAuth = PieceAuth.SecretText({
    displayName: "Bot Token",
    description: markdownDescription,
    required: true,
})

export const telegramBot = createPiece({
	displayName: "Telegram bot",
	logoUrl: 'https://cdn.activepieces.com/pieces/telegram_bot.png',
    auth: telegramBotAuth,
	actions: [telegramSendMessageAction],
	authors: ['abuaboud', 'Abdallah-Alwarawreh'],
	triggers: [telegramNewMessage],
});
