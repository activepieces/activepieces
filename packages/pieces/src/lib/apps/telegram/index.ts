import {createPiece} from '../../framework/piece';
import { telegramSendMessageAction } from './action/send_message-action';

export const telegramBot = createPiece({
	name: 'telegram_bot',
	displayName: "Telegram bot",
	logoUrl: 'https://cdn.activepieces.com/pieces/telegram_bot.png',
	actions: [telegramSendMessageAction],
	triggers: [],
});
