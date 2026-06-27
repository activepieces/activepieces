import { createCustomApiCallAction, httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  createPiece,
  Property,
} from '@activepieces/pieces-framework';

import { PieceCategory } from '@activepieces/pieces-framework';
import crypto from 'node:crypto';
import { requestActionDirectMessageAction } from './lib/actions/request-action-direct-message';
import { requestActionMessageAction } from './lib/actions/request-action-message';
import { requestApprovalDirectMessageAction } from './lib/actions/request-approval-direct-message';
import { requestSendApprovalMessageAction } from './lib/actions/request-approval-message';
import { slackSendDirectMessageAction } from './lib/actions/send-direct-message-action';
import { slackSendMessageAction } from './lib/actions/send-message-action';
import { newReactionAdded } from './lib/triggers/new-reaction-added';
import { newReactionRemoved } from './lib/triggers/new-reaction-removed';
import { uploadFile } from './lib/actions/upload-file';
import { searchMessages } from './lib/actions/search-messages';
import { updateMessage } from './lib/actions/update-message';
import { findUserByEmailAction } from './lib/actions/find-user-by-email';
import { updateProfileAction } from './lib/actions/update-profile';
import { createChannelAction } from './lib/actions/create-channel';
import { channelCreated } from './lib/triggers/new-channel';
import { addRectionToMessageAction } from './lib/actions/add-reaction-to-message';
import { getChannelHistory } from './lib/actions/get-channel-history';
import { findUserByHandleAction } from './lib/actions/find-user-by-handle';
import { setUserStatusAction } from './lib/actions/set-user-status';
import { newMention } from './lib/triggers/new-mention';
import { markdownToSlackFormat } from './lib/actions/markdown-to-slack-format';
import { newCommand } from './lib/triggers/new-command';
import { getFileAction } from './lib/actions/get-file';
import { newMessageTrigger } from './lib/triggers/new-message';
import { newMessageInChannelTrigger } from './lib/triggers/new-message-in-channel';
import { newDirectMessageTrigger } from './lib/triggers/new-direct-message';
import { retrieveThreadMessages } from './lib/actions/retrieve-thread-messages';
import { newMentionInDirectMessageTrigger } from './lib/triggers/new-mention-in-direct-message';
import { newCommandInDirectMessageTrigger } from './lib/triggers/new-command-in-direct-message';
import { setChannelTopicAction } from './lib/actions/set-channel-topic';
import { getMessageAction } from './lib/actions/get-message';
import { findUserByIdAction } from './lib/actions/find-user-by-id';
import { newUserTrigger } from './lib/triggers/new-user';
import { newSavedMessageTrigger } from './lib/triggers/new-saved-message';
import { newTeamCustomEmojiTrigger } from './lib/triggers/new-team-custom-emoji';
import { inviteUserToChannelAction } from './lib/actions/invite-user-to-channel';
import { listUsers } from './lib/actions/list-users';
import { deleteMessageAction } from './lib/actions/delete-message';
import { newModalInteractionTrigger } from './lib/triggers/new-modal-interaction';
import { slackAuth } from './lib/auth';
import { getBotToken, getUserToken } from './lib/common/auth-helpers';
import type { SlackAuthValue } from './lib/common/auth-helpers';
import { updateGroupUsersAction } from './lib/actions/update-user-groups';
import { getGroupByHandleAction } from './lib/actions/get-group-by-handle';
import { slackPostMessageAction } from './lib/actions/post-message.action';
import { slackSendDirectMessageAiAction } from './lib/actions/send-direct-message.action';
import { slackScheduleMessageAction } from './lib/actions/schedule-message.action';
import { slackListScheduledMessagesAction } from './lib/actions/list-scheduled-messages.action';
import { slackDeleteScheduledMessageAction } from './lib/actions/delete-scheduled-message.action';
import { slackUpdateMessageAiAction } from './lib/actions/update-message.action';
import { slackDeleteMessageAiAction } from './lib/actions/delete-message.action';
import { slackSendEphemeralMessageAction } from './lib/actions/send-ephemeral-message.action';
import { slackGetMessagePermalinkAction } from './lib/actions/get-message-permalink.action';
import { slackGetChannelHistoryAiAction } from './lib/actions/get-channel-history.action';
import { slackGetThreadRepliesAiAction } from './lib/actions/get-thread-replies.action';
import { slackSearchMessagesAiAction } from './lib/actions/search-messages.action';
import { slackSearchAllAction } from './lib/actions/search-all.action';
import { slackMarkConversationReadAction } from './lib/actions/mark-conversation-read.action';
import { slackFindUserByEmail } from './lib/actions/find-user-by-email.ai';
import { slackGetUser } from './lib/actions/get-user.ai';
import { slackListUsers } from './lib/actions/list-users.ai';
import { slackFindUserByHandle } from './lib/actions/find-user-by-handle.ai';
import { slackAddReaction } from './lib/actions/add-reaction.ai';
import { archiveChannelAction } from './lib/actions/archive-channel.action';
import { closeDmAction } from './lib/actions/close-dm.action';
import { createChannelAiAction } from './lib/actions/create-channel-ai';
import { findChannelAction } from './lib/actions/find-channel';
import { getChannelInfoAction } from './lib/actions/get-channel-info';
import { slackGetFile } from './lib/actions/get-file.ai';
import { slackGetReactions } from './lib/actions/get-reactions.ai';
import { inviteUsersToChannelAiAction } from './lib/actions/invite-users-to-channel-ai';
import { joinChannelAction } from './lib/actions/join-channel.action';
import { leaveChannelAction } from './lib/actions/leave-channel.action';
import { listChannelMembersAction } from './lib/actions/list-channel-members';
import { listChannelsAction } from './lib/actions/list-channels';
import { slackListCustomEmoji } from './lib/actions/list-custom-emoji.ai';
import { slackListFiles } from './lib/actions/list-files.ai';
import { listUserConversationsAction } from './lib/actions/list-user-conversations';
import { slackListUserGroups } from './lib/actions/list-user-groups.ai';
import { slackListUserReactions } from './lib/actions/list-user-reactions.ai';
import { slackRemoveReaction } from './lib/actions/remove-reaction.ai';
import { removeUserFromChannelAction } from './lib/actions/remove-user-from-channel.action';
import { renameChannelAction } from './lib/actions/rename-channel.action';
import { setChannelPurposeAction } from './lib/actions/set-channel-purpose.action';
import { setChannelTopicAiAction } from './lib/actions/set-channel-topic-ai';
import { slackSetUserStatus } from './lib/actions/set-user-status.ai';
import { slackUpdateProfile } from './lib/actions/update-profile.ai';
import { unarchiveChannelAction } from './lib/actions/unarchive-channel.action';

export { slackAuth, slackOAuth2Auth } from './lib/auth';

export const slack = createPiece({
  displayName: 'Slack',
  description: 'Channel-based messaging platform',
  minimumSupportedRelease: '0.82.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/slack.png',
  categories: [PieceCategory.COMMUNICATION],
  auth: slackAuth,
  events: {
    parseAndReply: ({ payload, server }) => {
      if (payload.headers['content-type'] === 'application/x-www-form-urlencoded') {
        if (payload.body && typeof payload.body == 'object' && 'payload' in payload.body) {
          const interactionPayloadBody = JSON.parse(
            (payload.body as { payload: string }).payload,
          ) as InteractionPayloadBody;
          if (interactionPayloadBody.type === 'block_actions') {
            const action = interactionPayloadBody.actions?.[0];
            if (
              action &&
              action.type === 'button' &&
              action.value?.startsWith(server.publicUrl)
            ) {
              // We don't await the promise as we don't handle the response anyway
              httpClient.sendRequest({
                url: action.value,
                method: HttpMethod.POST,
                body: interactionPayloadBody,
              });
            }
          } else if (
            interactionPayloadBody.type === 'view_submission' ||
            interactionPayloadBody.type === 'view_closed'
          ) {
            const viewModalPayload = interactionPayloadBody as unknown as {
              type: string;
              team: {
                id: string;
                token: string;
                api_app_id: string;
              };
            };

            return {
              event: viewModalPayload.type,
              identifierValue: viewModalPayload.team.id,
            };
          }
        }
        return {
          reply: {
            headers: {},
            body: {},
          },
        };
      } else {
        const eventPayloadBody = payload.body as EventPayloadBody;
        if (eventPayloadBody.challenge) {
          return {
            reply: {
              body: eventPayloadBody['challenge'],
              headers: {},
            },
          };
        }

        return {
          event: eventPayloadBody?.event?.type,
          identifierValue: eventPayloadBody.team_id,
        };
      }
    },
    verify: ({ webhookSecret, payload }) => {
      // Construct the signature base string
      const timestamp = payload.headers['x-slack-request-timestamp'];
      const signature = payload.headers['x-slack-signature'];
      const signatureBaseString = `v0:${timestamp}:${payload.rawBody}`;
      const hmac = crypto.createHmac('sha256', webhookSecret as string);
      hmac.update(signatureBaseString);
      const computedSignature = `v0=${hmac.digest('hex')}`;
      return signature === computedSignature;
    },
  },
  authors: [
    'rita-gorokhod',
    'AdamSelene',
    'Abdallah-Alwarawreh',
    'kishanprmr',
    'MoShizzle',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
  ],
  actions: [
    addRectionToMessageAction,
    slackSendDirectMessageAction,
    slackSendMessageAction,
    requestApprovalDirectMessageAction,
    requestSendApprovalMessageAction,
    requestActionDirectMessageAction,
    requestActionMessageAction,
    uploadFile,
    getFileAction,
    searchMessages,
    findUserByEmailAction,
    findUserByHandleAction,
    findUserByIdAction,
    listUsers,
    updateMessage,
    deleteMessageAction,
    createChannelAction,
    updateProfileAction,
    getChannelHistory,
    setUserStatusAction,
    markdownToSlackFormat,
    retrieveThreadMessages,
    setChannelTopicAction,
    getMessageAction,
    inviteUserToChannelAction,
    getGroupByHandleAction,
    updateGroupUsersAction,
    slackPostMessageAction,
    slackSendDirectMessageAiAction,
    slackScheduleMessageAction,
    slackListScheduledMessagesAction,
    slackDeleteScheduledMessageAction,
    slackUpdateMessageAiAction,
    slackDeleteMessageAiAction,
    slackSendEphemeralMessageAction,
    slackGetMessagePermalinkAction,
    slackGetChannelHistoryAiAction,
    slackGetThreadRepliesAiAction,
    slackSearchMessagesAiAction,
    slackSearchAllAction,
    slackMarkConversationReadAction,
    slackFindUserByEmail,
    slackGetUser,
    slackListUsers,
    slackFindUserByHandle,
    slackAddReaction,
    archiveChannelAction,
    closeDmAction,
    createChannelAiAction,
    findChannelAction,
    getChannelInfoAction,
    slackGetFile,
    slackGetReactions,
    inviteUsersToChannelAiAction,
    joinChannelAction,
    leaveChannelAction,
    listChannelMembersAction,
    listChannelsAction,
    slackListCustomEmoji,
    slackListFiles,
    listUserConversationsAction,
    slackListUserGroups,
    slackListUserReactions,
    slackRemoveReaction,
    removeUserFromChannelAction,
    renameChannelAction,
    setChannelPurposeAction,
    setChannelTopicAiAction,
    slackSetUserStatus,
    slackUpdateProfile,
    unarchiveChannelAction,
    createCustomApiCallAction({
      baseUrl: () => {
        return 'https://slack.com/api';
      },
      auth: slackAuth,
      authMapping: async (auth, propsValue) => {
        const typedAuth = auth as SlackAuthValue;
        if (propsValue.useUserToken) {
          const userToken = getUserToken(typedAuth);
          if (userToken) {
            return {
              Authorization: `Bearer ${userToken}`,
            };
          }
        }
        return {
          Authorization: `Bearer ${getBotToken(typedAuth)}`,
        };
      },
      extraProps: {
        useUserToken: Property.Checkbox({
          displayName: 'Use user token',
          description: 'Use user token instead of bot token',
          required: true,
          defaultValue: false,
        }),
      },
    }),
  ],
  triggers: [
    newMessageTrigger,
    newMessageInChannelTrigger,
    newDirectMessageTrigger,
    newMention,
    newMentionInDirectMessageTrigger,
    newReactionAdded,
    newReactionRemoved,
    channelCreated,
    newCommand,
    newCommandInDirectMessageTrigger,
    newUserTrigger,
    newSavedMessageTrigger,
    newTeamCustomEmojiTrigger,
    newModalInteractionTrigger,
  ],
});

type EventPayloadBody = {
  // Event payload
  challenge: string;
  event: {
    type: string;
  };
  team_id: string;
};
type InteractionPayloadBody = {
  // Interaction payload
  type?: string;
  actions?: {
    type: string;
    value: string;
  }[];
};
