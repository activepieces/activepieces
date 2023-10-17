import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { campaignChatCompletedAction } from './lib/actions/campaign-chat-completed';
import { campaignChatCompletedTrigger } from './lib/triggers/campaign-chat-completed';
import { chatsCompletedTrigger } from './lib/triggers/chats-completed';

export const humanbot = createPiece({
    displayName: 'Humanbot',
    description: 'Humanbot - Online Chat With a Bot',
    auth: PieceAuth.None(),
    minimumSupportedRelease: '0.9.0',
    logoUrl: 'https://app.humanbot.io/img/icon.png',
    authors: [],
    actions: [],
    triggers: [campaignChatCompletedTrigger, chatsCompletedTrigger],
});
