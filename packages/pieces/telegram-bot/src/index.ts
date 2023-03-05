import packageJson from '../package.json';
import { createPiece } from '@activepieces/framework';
import { telegramSendMessageAction } from './lib/action/send-text-message.action';

export const telegramBot = createPiece({
	name: 'telegram_bot',
	displayName: "Telegram bot",
	logoUrl: 'https://cdn.activepieces.com/pieces/telegram_bot.png',
  version: packageJson.version,
	actions: [telegramSendMessageAction],
	authors: ['abuaboud'],
	triggers: [],
});
