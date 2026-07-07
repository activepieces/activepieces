import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { sendChannelMessageAsBotAction } from './lib/actions/send-channel-message-as-bot';
import { microsoftTeamsBotAuth } from './lib/auth';

export const microsoftTeamsBot = createPiece({
  displayName: 'Microsoft Teams Bot',
  description: 'Send messages to Teams channels from the Activepieces Bot, once it has been installed into a team.',
  minimumSupportedRelease: '0.86.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-teams.png',
  categories: [PieceCategory.COMMUNICATION],
  auth: microsoftTeamsBotAuth,
  authors: ['kishanprmr'],
  actions: [
    sendChannelMessageAsBotAction,
  ],
  triggers: [],
});
