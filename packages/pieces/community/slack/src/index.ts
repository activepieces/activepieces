import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

import { PieceCategory } from '@activepieces/shared';
import crypto from 'node:crypto';
import { requestActionDirectMessageAction } from './lib/actions/request-action-direct-message';
import { requestActionMessageAction } from './lib/actions/request-action-message';
import { requestApprovalDirectMessageAction } from './lib/actions/request-approval-direct-message';
import { requestSendApprovalMessageAction } from './lib/actions/request-approval-message';
import { slackSendDirectMessageAction } from './lib/actions/send-direct-message-action';
import { slackSendMessageAction } from './lib/actions/send-message-action';
import { newReactionAdded } from './lib/triggers/new-reaction-added';
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

export const slackAuth = PieceAuth.OAuth2({
  description: '',
  authUrl:
    'https://slack.com/oauth/v2/authorize?user_scope=search:read,users.profile:write,reactions:read,im:history,stars:read,channels:write,groups:write,im:write,mpim:write,channels:write.invites,groups:write.invites,channels:history,groups:history,chat:write,users:read',
  tokenUrl: 'https://slack.com/api/oauth.v2.access',
  required: true,
  scope: [
    'channels:read',
    'channels:manage',
    'channels:history',
    'chat:write',
    'groups:read',
    'groups:write',
    'groups:history',
    'reactions:read',
    'mpim:read',
    'mpim:write',
    'mpim:history',
    'im:write',
    'im:read',
    'im:history',
    'users:read',
    'files:write',
    'files:read',
    'users:read.email',
    'reactions:write',
    'usergroups:read',
    'chat:write.customize',
    'links:read',
    'links:write',
    'emoji:read',
    'users.profile:read',
    'channels:write.invites',
    'groups:write.invites',
  ],
});

export const slack = createPiece({
  displayName: 'Slack',
  description: 'Channel-based messaging platform',
  minimumSupportedRelease: '0.66.7',
  logoUrl: 'https://cdn.activepieces.com/pieces/slack.png',
  categories: [PieceCategory.COMMUNICATION],
  auth: slackAuth,
  events: {
    parseAndReply: ({ payload, server }) => {
      if (
        payload.headers['content-type'] === 'application/x-www-form-urlencoded'
      ) {
        if (
          payload.body &&
          typeof payload.body == 'object' &&
          'payload' in payload.body
        ) {
          const interactionPayloadBody = JSON.parse(
            (payload.body as { payload: string }).payload
          ) as InteractionPayloadBody;
          if (interactionPayloadBody.type === 'block_actions') {
            const action = interactionPayloadBody.actions?.at(0);
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
    createChannelAction,
    updateProfileAction,
    getChannelHistory,
    setUserStatusAction,
    markdownToSlackFormat,
    retrieveThreadMessages,
    setChannelTopicAction,
    getMessageAction,
    inviteUserToChannelAction,
    createCustomApiCallAction({
      baseUrl: () => {
        return 'https://slack.com/api';
      },
      auth: slackAuth,
      authMapping: async (auth, propsValue) => {
        if (propsValue.useUserToken) {
          return {
            Authorization: `Bearer ${
              (auth as OAuth2PropertyValue).data['authed_user']?.access_token
            }`,
          };
        } else {
          return {
            Authorization: `Bearer ${
              (auth as OAuth2PropertyValue).access_token
            }`,
          };
        }
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
    channelCreated,
    newCommand,
    newCommandInDirectMessageTrigger,
    newUserTrigger,
    newSavedMessageTrigger,
    newTeamCustomEmojiTrigger,
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
