import packageJson from '../package.json';
import { createPiece } from '@activepieces/pieces-framework';
import { telegramSendMessageAction } from './lib/action/send-text-message.action';

export const telegramBot = createPiece({
	name: 'telegram-bot',
	displayName: "Telegram bot",
	logoUrl: 'https://cdn.activepieces.com/pieces/telegram_bot.png',
	version: packageJson.version,
	actions: [telegramSendMessageAction],
	authors: ['abuaboud'],
	triggers: [],
});
