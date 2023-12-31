import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { telegramSendMessageAction } from './lib/action/send-text-message.action';
import { telegramNewMessage } from './lib/trigger/new-message';
import { telegramSendMediaAction } from './lib/action/send-media.action';
import { telegramGetChatMemberAction } from './lib/action/get-chat-member';
import { telegramCreateInviteLinkAction } from './lib/action/create-invite-link';

const markdownDescription = `
**Authentication**:

1. Begin a conversation with the [Botfather](https://telegram.me/BotFather).
2. Type in "/newbot"
3. Choose a name for your bot
4. Choose a username for your bot.
5. Copy the token value from the Botfather and use it activepieces connection.
6. Congratulations! You can now use your new Telegram connection in your flows.
`;

export const telegramBotAuth = PieceAuth.SecretText({
  displayName: 'Bot Token',
  description: markdownDescription,
  required: true
});

export const telegramBot = createPiece({
  displayName: 'Telegram Bot',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/telegram_bot.png',
  auth: telegramBotAuth,
  actions: [telegramSendMessageAction, telegramSendMediaAction, telegramGetChatMemberAction, telegramCreateInviteLinkAction],
  authors: ['abuaboud', 'Abdallah-Alwarawreh'],
  triggers: [telegramNewMessage]
});
