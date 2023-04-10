
import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { squareTriggers } from './lib/triggers';
import crypto from 'crypto'

export const square = createPiece({
  name: 'square',
  displayName: 'square',
  logoUrl: 'https://cdn.activepieces.com/pieces/square.png',
  version: packageJson.version,
  authors: [
    "abuaboud"
  ],
  actions: [
  ],
  triggers: squareTriggers,
  events: {
    verify: ({ webhookSecret, payload, appWebhookUrl}) => {
      const signature = payload.headers['x-square-hmacsha256-signature'];
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(appWebhookUrl+payload.rawBody);
      const hash = hmac.digest('base64');
      return hash === signature;
    },
    parseAndReply: ({ payload }) => {
      return { event: payload.body?.type, identifierValue: payload.body.merchant_id}
    }
  }
});
