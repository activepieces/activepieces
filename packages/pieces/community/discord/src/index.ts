import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { PieceAuth, createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { discordAddRoleToMember } from './lib/actions/add-role-to-member'
import { discordBanGuildMember } from './lib/actions/ban-a-guild-member'
import { discordCreateChannel } from './lib/actions/create-channel'
import { discordCreateGuildRole } from './lib/actions/create-guild-role'
import { discordDeleteChannel } from './lib/actions/delete-channel'
import { discordDeleteGuildRole } from './lib/actions/delete-guild-role'
import { discordFindChannel } from './lib/actions/find-channel'
import { discordFindGuildMemberByUsername } from './lib/actions/find-guild-member'
import { discordRemoveBanFromUser } from './lib/actions/remove-ban-from-user'
import { discordRemoveMemberFromGuild } from './lib/actions/remove-member-from-guild'
import { discordRemoveRoleFromMember } from './lib/actions/remove-role-from-member'
import { discordRenameChannel } from './lib/actions/rename-channel'
import { discordSendApprovalMessage } from './lib/actions/send-approval-message'
import { discordSendMessageWebhook } from './lib/actions/send-message-webhook'
import { sendMessageWithBot } from './lib/actions/send-message-with-bot'
import { newMember } from './lib/triggers/new-member'
import { newMessage } from './lib/triggers/new-message'

const markdown = `
To obtain a token, follow these steps:
1. Go to https://discord.com/developers/applications
2. Click on Application (or create one if you don't have one)
3. Click on Bot
4. Copy the token
`

export const discordAuth = PieceAuth.SecretText({
  displayName: 'Bot Token',
  description: markdown,
  required: true,
})

export const discord = createPiece({
  displayName: 'Discord',
  description: 'Instant messaging and VoIP social platform',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/discord.png',
  categories: [PieceCategory.COMMUNICATION],
  auth: discordAuth,
  actions: [
    sendMessageWithBot,
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
      auth: discordAuth,
      baseUrl: () => {
        return 'https://discord.com/api/v9'
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bot ${auth}`,
        }
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
    'AshotZaqoyan',
  ],
  triggers: [newMessage, newMember],
})
