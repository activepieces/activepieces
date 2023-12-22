import crypto from 'node:crypto'
import { PieceAuth, createPiece } from '@activepieces/pieces-framework'
import { slackSendDirectMessageAction } from './lib/actions/send-direct-message-action'
import { requestApprovalDirectMessageAction } from './lib/actions/request-approval-direct-message'
import { slackSendMessageAction } from './lib/actions/send-message-action';
import { newMessage } from './lib/triggers/new-message';
import { newReactionAdded } from './lib/triggers/new-reaction-added';
import { requestSendApprovalMessageAction } from './lib/actions/request-approval-message';
import { requestActionDirectMessageAction } from './lib/actions/request-action-direct-message';
import { requestActionMessageAction } from './lib/actions/request-action-message';

export const slackAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://slack.com/oauth/authorize',
  tokenUrl: 'https://slack.com/api/oauth.access',
  required: true,
  scope: [
    'channels:read',
    'channels:write',
    'channels:history',
    'chat:write:bot',
    'groups:read',
    'reactions:read',
    'mpim:read',
    'users:read',
    'files:write:user',
    'files:read'
  ],
})

export const slack = createPiece({
  displayName: 'Slack',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/slack.png',
  auth: slackAuth,
  events: {
    parseAndReply: ({ payload }) => {
      const payloadBody = payload.body as PayloadBody;
      if (payloadBody.challenge) {
        return {
          reply: {
            body: payloadBody['challenge'],
            headers: {}
          }
        };
      }
      return { event: payloadBody?.event?.type, identifierValue: payloadBody.team_id }
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
    }
  },
  actions: [
    slackSendDirectMessageAction,
    slackSendMessageAction,
    requestApprovalDirectMessageAction,
    requestSendApprovalMessageAction,
    requestActionDirectMessageAction,
    requestActionMessageAction
  ],
  triggers: [
    newMessage,
    newReactionAdded,
  ]
})

type PayloadBody = {
  challenge: string
  event: {
    type: string
  }
  team_id: string
}
