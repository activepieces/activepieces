import crypto from 'node:crypto'
import { AuthProp, Piece } from '@activepieces/pieces-framework'

export const slack = Piece.create({
  displayName: 'Slack',
  logoUrl: 'https://cdn.activepieces.com/pieces/slack.png',
  auth: AuthProp.OAuth2({
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
    ],
  }),
  events: {
    parseAndReply: ({ payload }) => {
      if (payload.body['challenge']) {
        return {
          reply: {
            body: payload.body['challenge'],
            headers: {}
          }
        };
      }
      return { event: payload.body?.event?.type, identifierValue: payload.body.team_id }
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
  }
})
