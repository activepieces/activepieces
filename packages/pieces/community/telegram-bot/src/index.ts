import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { telegramCreateInviteLinkAction } from './lib/action/create-invite-link';
import { telegramGetChatMemberAction } from './lib/action/get-chat-member';
import { telegramSendMediaAction } from './lib/action/send-media.action';
import { telegramSendMessageAction } from './lib/action/send-text-message.action';
import { telegramCommons } from './lib/common';
import { telegramNewMessage } from './lib/trigger/new-message';

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
  required: true,
});

export const telegramBot = createPiece({
  displayName: 'Telegram Bot',
  description: 'Build chatbots for Telegram',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/telegram_bot.png',
  categories: [PieceCategory.COMMUNICATION],
  auth: telegramBotAuth,
  actions: [
    telegramSendMessageAction,
    telegramSendMediaAction,
    telegramGetChatMemberAction,
    telegramCreateInviteLinkAction,
    createCustomApiCallAction({
      baseUrl: (auth) => telegramCommons.getApiUrl(auth as string, ''),
      auth: telegramBotAuth,
    }),
  ],
  authors: ["abdullahranginwala","tanoggy","alerdenisov","Abdallah-Alwarawreh","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  triggers: [telegramNewMessage],
});
