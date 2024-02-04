import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { discordAddRoleToMember } from './lib/actions/add-role-to-member';
import { discordFindChannel } from './lib/actions/find-channel';
import { discordFindGuildMemberByUsername } from './lib/actions/find-guild-member';
import { discordRemoveMemberFromGuild } from './lib/actions/remove-member-from-guild';
import { discordRemoveRoleFromMember } from './lib/actions/remove-role-from-member';
import { discordRenameChannel } from './lib/actions/rename-channel';
import { discordSendApprovalMessage } from './lib/actions/send-approval-message';
import { discordSendMessageWebhook } from './lib/actions/send-message-webhook';
import { newMessage } from './lib/trigger/new-message';

const markdown = `
To obtain a token, follow these steps:
1. Go to https://discord.com/developers/applications
2. Click on Application (or create one if you don't have one)
3. Click on Bot
4. Copy the token
`;

export const discordAuth = PieceAuth.SecretText({
  displayName: 'Bot Token',
  description: markdown,
  required: true,
});

export const discord = createPiece({
  displayName: 'Discord',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/discord.png',
  categories: [PieceCategory.COMMUNICATION],
  auth: discordAuth,
  actions: [
    discordSendMessageWebhook,
    discordSendApprovalMessage,
    discordAddRoleToMember,
    discordRemoveRoleFromMember,
    discordRemoveMemberFromGuild,
    discordFindGuildMemberByUsername,
    discordRenameChannel,
    discordFindChannel,
    createCustomApiCallAction({
      baseUrl: () => {
        return 'https://discord.com/api/v9';
      },
      authMapping: (auth) => {
        return {
          Authorization: `Bearer ${auth}`,
        };
      },
    }),
  ],
  authors: ['creed983', 'Abdallah-Alwarawreh', 'TaskMagicKyle'],
  triggers: [newMessage],
});
