import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
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
import { newMessage } from './lib/triggers/new-message';
import { discordRemoveBanFromUser } from './lib/actions/remove-ban-from-user';
import { discordCreateGuildRole } from './lib/actions/create-guild-role';
import { discordDeleteGuildRole } from './lib/actions/delete-guild-role';
import { discordBanGuildMember } from './lib/actions/ban-a-guild-member';
import { newMember } from './lib/triggers/new-member';
import { sendMessageWithBot } from './lib/actions/send-message-with-bot'
import { discordAuth } from './lib/auth';
// audience:'ai' agent atomics
import { discordSendMessage } from './lib/actions/ai-send-message';
import { discordCreateChannelAi } from './lib/actions/ai-create-channel';
import { discordDeleteChannelAi } from './lib/actions/ai-delete-channel';
import { discordRenameChannelAi } from './lib/actions/ai-rename-channel';
import { discordFindChannelAi } from './lib/actions/ai-find-channel';
import { discordAddRoleAi } from './lib/actions/ai-add-role';
import { discordRemoveRoleAi } from './lib/actions/ai-remove-role';
import { discordCreateRoleAi } from './lib/actions/ai-create-role';
import { discordDeleteRoleAi } from './lib/actions/ai-delete-role';
import { discordFindMember } from './lib/actions/ai-find-member';
import { discordListMessages } from './lib/actions/ai-list-messages';
import { discordEditMessage } from './lib/actions/ai-edit-message';
import { discordDeleteMessage } from './lib/actions/ai-delete-message';
import { discordBulkDeleteMessages } from './lib/actions/ai-bulk-delete-messages';
import { discordPinMessage } from './lib/actions/ai-pin-message';
import { discordUnpinMessage } from './lib/actions/ai-unpin-message';
import { discordListPinnedMessages } from './lib/actions/ai-list-pinned-messages';
import { discordAddReaction } from './lib/actions/ai-add-reaction';
import { discordRemoveReaction } from './lib/actions/ai-remove-reaction';
import { discordRemoveUserReaction } from './lib/actions/ai-remove-user-reaction';
import { discordListReactions } from './lib/actions/ai-list-reactions';
import { discordClearReactions } from './lib/actions/ai-clear-reactions';
import { discordCreateThreadFromMessage } from './lib/actions/ai-create-thread-from-message';
import { discordCreateThread } from './lib/actions/ai-create-thread';
import { discordListActiveThreads } from './lib/actions/ai-list-active-threads';
import { discordListArchivedThreads } from './lib/actions/ai-list-archived-threads';
import { discordJoinThread } from './lib/actions/ai-join-thread';
import { discordLeaveThread } from './lib/actions/ai-leave-thread';
import { discordAddThreadMember } from './lib/actions/ai-add-thread-member';
import { discordListChannels } from './lib/actions/ai-list-channels';
import { discordGetChannel } from './lib/actions/ai-get-channel';
import { discordGetMember } from './lib/actions/ai-get-member';
import { discordListBans } from './lib/actions/ai-list-bans';
import { discordListRoles } from './lib/actions/ai-list-roles';
import { discordUpdateRole } from './lib/actions/ai-update-role';
import { discordGetGuild } from './lib/actions/ai-get-guild';
import { discordListEmojis } from './lib/actions/ai-list-emojis';
import { discordCreateScheduledEvent } from './lib/actions/ai-create-scheduled-event';
import { discordListScheduledEvents } from './lib/actions/ai-list-scheduled-events';
import { discordUpdateScheduledEvent } from './lib/actions/ai-update-scheduled-event';
import { discordDeleteScheduledEvent } from './lib/actions/ai-delete-scheduled-event';
import { discordListInvites } from './lib/actions/ai-list-invites';
import { discordRevokeInvite } from './lib/actions/ai-revoke-invite';
import { discordCreateDm } from './lib/actions/ai-create-dm';
import { discordGetUser } from './lib/actions/ai-get-user';

const markdown = `
To obtain a token, follow these steps:
1. Go to https://discord.com/developers/applications
2. Click on Application (or create one if you don't have one)
3. Click on Bot
4. Copy the token
`;

export const discord = createPiece({
  displayName: 'Discord',
  description: 'Instant messaging and VoIP social platform',
  minimumSupportedRelease: '0.87.0',
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
    // audience:'ai' agent atomics
    discordSendMessage,
    discordCreateChannelAi,
    discordDeleteChannelAi,
    discordRenameChannelAi,
    discordFindChannelAi,
    discordAddRoleAi,
    discordRemoveRoleAi,
    discordCreateRoleAi,
    discordDeleteRoleAi,
    discordFindMember,
    discordListMessages,
    discordEditMessage,
    discordDeleteMessage,
    discordBulkDeleteMessages,
    discordPinMessage,
    discordUnpinMessage,
    discordListPinnedMessages,
    discordAddReaction,
    discordRemoveReaction,
    discordRemoveUserReaction,
    discordListReactions,
    discordClearReactions,
    discordCreateThreadFromMessage,
    discordCreateThread,
    discordListActiveThreads,
    discordListArchivedThreads,
    discordJoinThread,
    discordLeaveThread,
    discordAddThreadMember,
    discordListChannels,
    discordGetChannel,
    discordGetMember,
    discordListBans,
    discordListRoles,
    discordUpdateRole,
    discordGetGuild,
    discordListEmojis,
    discordCreateScheduledEvent,
    discordListScheduledEvents,
    discordUpdateScheduledEvent,
    discordDeleteScheduledEvent,
    discordListInvites,
    discordRevokeInvite,
    discordCreateDm,
    discordGetUser,
    createCustomApiCallAction({
      auth:discordAuth,
      baseUrl: () => {
        return 'https://discord.com/api/v9';
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bot ${auth.secret_text}`,
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
    'AshotZaqoyan'
  ],
  triggers: [newMessage, newMember],
});
