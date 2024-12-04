import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { discordAddRoleToMember } from './lib/actions/add-role-to-member';
import { discordFindChannel } from './lib/actions/find-channel';
import { discordFindGuildMemberByUsername } from './lib/actions/find-guild-member';
import { discordRemoveMemberFromGuild } from './lib/actions/remove-member-from-guild';
import { discordRemoveRoleFromMember } from './lib/actions/remove-role-from-member';
import { discordRenameChannel } from './lib/actions/rename-channel';
import { discordCreateChannel } from './lib/actions/create-channel';
import { discordDeleteChannel } from './lib/actions/delete-channel';
import { discordSendApprovalMessage } from './lib/actions/send-approval-message';
import { discordSendMessageWebhook } from './lib/actions/send-message-webhook';
import { newMessage } from './lib/trigger/new-message';
import { discordRemoveBanFromUser } from './lib/actions/remove-ban-from-user';
import { discordCreateGuildRole } from './lib/actions/create-guild-role';
import { discordDeleteGuildRole } from './lib/actions/delete-guild-role';
import { discordBanGuildMember } from './lib/actions/ban-a-guild-member';

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
  description: 'Instant messaging and VoIP social platform',
  minimumSupportedRelease: '0.30.0',
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
    discordCreateChannel,
    discordDeleteChannel,
    discordFindChannel,
    discordRemoveBanFromUser,
    discordCreateGuildRole,
    discordDeleteGuildRole,
    discordBanGuildMember,
    createCustomApiCallAction({
      auth:discordAuth,
      baseUrl: () => {
        return 'https://discord.com/api/v9';
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bot ${auth}`,
        };
      },
    }),
  ],
  authors: [
    'creed983',
    'TaskMagicKyle',
    'karimkhaleel',
    'Abdallah-Alwarawreh',
    'kishanprmr',
    'MoShizzle',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
    'tintinthedev',
  ],
  triggers: [newMessage],
});
