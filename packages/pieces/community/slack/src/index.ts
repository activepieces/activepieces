import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import crypto from 'node:crypto';
import { requestActionDirectMessageAction } from './lib/actions/request-action-direct-message';
import { requestActionMessageAction } from './lib/actions/request-action-message';
import { requestApprovalDirectMessageAction } from './lib/actions/request-approval-direct-message';
import { requestSendApprovalMessageAction } from './lib/actions/request-approval-message';
import { slackSendDirectMessageAction } from './lib/actions/send-direct-message-action';
import { slackSendMessageAction } from './lib/actions/send-message-action';
import { newMessage } from './lib/triggers/new-message';
import { newReactionAdded } from './lib/triggers/new-reaction-added';
import { uploadFile } from './lib/actions/upload-file';
import { searchMessages } from './lib/actions/search-messages';

export const slackAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://slack.com/oauth/v2/authorize?user_scope=search:read',
  tokenUrl: 'https://slack.com/api/oauth.v2.access',
  required: true,
  scope: [
    'channels:read',
    'channels:history',
    'chat:write',
    'groups:read',
    'reactions:read',
    'mpim:read',
    'users:read',
    'files:write',
    'files:read',
  ],
});

export const slack = createPiece({
  displayName: 'Slack',
  description: 'Channel-based messaging platform',
  minimumSupportedRelease: '0.20.0',
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
      const hmac = crypto.createHmac('sha256', webhookSecret);
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
    slackSendDirectMessageAction,
    slackSendMessageAction,
    requestApprovalDirectMessageAction,
    requestSendApprovalMessageAction,
    requestActionDirectMessageAction,
    requestActionMessageAction,
    uploadFile,
    searchMessages,
    createCustomApiCallAction({
      baseUrl: () => {
        return 'https://slack.com/api';
      },
      auth: slackAuth,
      authMapping: (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        };
      },
    }),
  ],
  triggers: [newMessage, newReactionAdded],
});

type PayloadBody = {
  challenge: string;
  event: {
    type: string;
  };
  team_id: string;
};
