import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createChannelAction } from './lib/actions/create-channel';
import { createChatAndSendMessageAction } from './lib/actions/create-chat-and-send-message';
import { createPrivateChannelAction } from './lib/actions/create-private-channel';
import { deleteChatMessageAction } from './lib/actions/delete-chat-message';
import { findChannelAction } from './lib/actions/find-channel';
import { findTeamMemberAction } from './lib/actions/find-team-member';
import { getChannelMessageAction } from './lib/actions/get-channel-message';
import { getChatMessageAction } from './lib/actions/get-chat-message';
import { replyToChannelMessageAction } from './lib/actions/reply-to-channel-message';
import { requestApprovalInChannel } from './lib/actions/request-approval-channel-message';
import { requestApprovalDirectMessage } from './lib/actions/request-approval-direct-message';
import { sendChannelMessageAction } from './lib/actions/send-channel-message';
import { sendChatMessageAction } from './lib/actions/send-chat-message';
import { microsoftTeamsAuth } from './lib/auth';
import { newChannelTrigger } from './lib/triggers/new-channel';
import { newChannelMessageTrigger } from './lib/triggers/new-channel-message';
import { newChatTrigger } from './lib/triggers/new-chat';
import { newChatMessageTrigger } from './lib/triggers/new-chat-message';

export const microsoftTeams = createPiece({
  displayName: 'Microsoft Teams',
  auth: microsoftTeamsAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-teams.png',
  categories: [
    PieceCategory.BUSINESS_INTELLIGENCE,
    PieceCategory.COMMUNICATION,
  ],
  authors: ['kishanprmr'],
  actions: [
    createChannelAction,
    sendChannelMessageAction,
    sendChatMessageAction,
    replyToChannelMessageAction,
    createChatAndSendMessageAction,
    createPrivateChannelAction,
    getChatMessageAction,
    deleteChatMessageAction,
    getChannelMessageAction,
    findChannelAction,
    findTeamMemberAction,
    requestApprovalInChannel,
    requestApprovalDirectMessage,
    createCustomApiCallAction({
      auth: microsoftTeamsAuth,
      baseUrl: () => 'https://graph.microsoft.com/v1.0/teams',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [
    newChannelMessageTrigger,
    newChannelTrigger,
    newChatTrigger,
    newChatMessageTrigger,
  ],
});
