import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { telegramAnswerCallbackQueryAction } from './lib/action/answer-callback-query.action';
import { telegramCreateInviteLinkAction } from './lib/action/create-invite-link';
import { telegramDeleteMessageAction } from './lib/action/delete-message.action';
import { telegramEditMessageTextAction } from './lib/action/edit-message-text.action';
import { telegramForwardMessageAction } from './lib/action/forward-message.action';
import { telegramGetChatAction } from './lib/action/get-chat.action';
import { telegramGetChatMemberAction } from './lib/action/get-chat-member';
import { telegramGetFileAction } from './lib/action/get-file.action';
import { telegramPinMessageAction } from './lib/action/pin-message.action';
import { telegramRequestApprovalMessageAction } from './lib/action/request-approval-message';
import { telegramSendAudioAction } from './lib/action/send-audio.action';
import { telegramSendChatActionAction } from './lib/action/send-chat-action.action';
import { telegramSendDocumentAction } from './lib/action/send-document.action';
import { telegramSendLocationAction } from './lib/action/send-location.action';
import { telegramSendMediaAction } from './lib/action/send-media.action';
import { telegramSendMediaGroupAction } from './lib/action/send-media-group.action';
import { telegramSendMessageAction } from './lib/action/send-text-message.action';
import { telegramSendPollAction } from './lib/action/send-poll.action';
import { telegramUnpinMessageAction } from './lib/action/unpin-message.action';
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
  minimumSupportedRelease: '0.82.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/telegram_bot.png',
  categories: [PieceCategory.COMMUNICATION],
  auth: telegramBotAuth,
  actions: [
    telegramSendMessageAction,
    telegramSendMediaAction,
    telegramSendDocumentAction,
    telegramSendAudioAction,
    telegramSendLocationAction,
    telegramSendMediaGroupAction,
    telegramSendPollAction,
    telegramSendChatActionAction,
    telegramEditMessageTextAction,
    telegramDeleteMessageAction,
    telegramForwardMessageAction,
    telegramPinMessageAction,
    telegramUnpinMessageAction,
    telegramGetChatAction,
    telegramGetChatMemberAction,
    telegramGetFileAction,
    telegramCreateInviteLinkAction,
    telegramAnswerCallbackQueryAction,
    telegramRequestApprovalMessageAction,
    createCustomApiCallAction({
      baseUrl: (auth) => auth ? telegramCommons.getApiUrl(auth, '') : '',
      auth: telegramBotAuth,
    }),
  ],
  authors: ["abdullahranginwala","tanoggy","alerdenisov","Abdallah-Alwarawreh","kishanprmr","MoShizzle","khaledmashaly","abuaboud",'sanket-a11y'],
  triggers: [telegramNewMessage],
});
