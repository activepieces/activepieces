import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { campaignChatCompletedTrigger } from './lib/triggers/campaign-chat-completed';
import { campaignChatEmailCompletedTrigger } from './lib/triggers/campaign-chat-email-completed';
import { chatsCompletedTrigger } from './lib/triggers/chats-completed';
import { chatsEmailCompletedTrigger } from './lib/triggers/chats-email-completed';

export const humanbot = createPiece({
    displayName: 'Humanbot',
    description: 'Humanbot - Online Chat With a Bot',
    auth: PieceAuth.None(),
    minimumSupportedRelease: '0.9.0',
    logoUrl: 'https://app.humanbot.io/img/icon.png',
    authors: ['Humanbot'],
    actions: [],
    triggers: [
        campaignChatCompletedTrigger,
        campaignChatEmailCompletedTrigger,
        chatsCompletedTrigger,
        chatsEmailCompletedTrigger
    ],
});
