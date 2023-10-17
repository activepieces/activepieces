import {createPiece, PieceAuth} from '@activepieces/pieces-framework';
import {campaignChatCompletedTrigger} from './lib/triggers/campaign-chat-completed';
import {campaignChatCompletedAction} from './lib/actions/campaign-chat-completed';

export const humanbot = createPiece({
    displayName: 'Humanbot',
    description: 'Humanbot - Online Chat With a Bot',
    auth: PieceAuth.None(),
    minimumSupportedRelease: '0.9.0',
    logoUrl: 'https://app.humanbot.io/img/logo-small.png',
    authors: [],
    actions: [campaignChatCompletedAction],
    triggers: [campaignChatCompletedTrigger],
});
