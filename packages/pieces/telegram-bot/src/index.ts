import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { telegramSendMessageAction } from './lib/action/send-text-message.action';
import { telegramNewMessage } from './lib/trigger/new-message';

const markdownDescription = `
**Authentication**:

1. Begin a conversation with the [Botfather](https://telegram.me/BotFather).
2. Type in "/newbot"
3. Choose a name for your bot
4. Choose a username for your bot.
5. Copy the token value from the Botfather and use it activepieces connection.
6. Congratulations! You can now use your new Telegram connection in your flows.

**Obtain Chat ID to Private Users / Channel:**

To message a private user or channel via Telegram bot, you need their chat ID. A "Get My ID" bot can help obtain it. Remember to initiate the chat with the bot, or you'll get an error for "chat not found."
`;

export const telegramBotAuth = PieceAuth.SecretText({
  displayName: 'Bot Token',
  description: markdownDescription,
  required: true
});

export const telegramBot = createPiece({
  displayName: 'Telegram bot',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/telegram_bot.png',
  auth: telegramBotAuth,
  actions: [telegramSendMessageAction],
  authors: ['abuaboud', 'Abdallah-Alwarawreh'],
  triggers: [telegramNewMessage]
});
