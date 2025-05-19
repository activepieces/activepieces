import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
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

export const slackAuth = PieceAuth.OAuth2({
  description: '',
  authUrl:
    'https://slack.com/oauth/v2/authorize?user_scope=search:read,users.profile:write,reactions:read,im:history',
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
  ],
});

export const slack = createPiece({
  displayName: 'Slack',
  description: 'Channel-based messaging platform',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/slack.png',
  categories: [PieceCategory.COMMUNICATION],
  auth: slackAuth,
  events: {
    parseAndReply: ({ payload }) => {
      const payloadBody = payload.body as PayloadBody;
      if (payloadBody.challenge) {
        return {
          reply: {
            body: payloadBody['challenge'],
            headers: {},
          },
        };
      }
      return {
        event: payloadBody?.event?.type,
        identifierValue: payloadBody.team_id,
      };
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
    updateMessage,
    createChannelAction,
    updateProfileAction,
    getChannelHistory,
    setUserStatusAction,
    markdownToSlackFormat,
    retrieveThreadMessages,
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
  ],
});

type PayloadBody = {
  challenge: string;
  event: {
    type: string;
  };
  team_id: string;
};
