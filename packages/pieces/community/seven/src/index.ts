import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { smsSend } from './action/sms-send';
import { ttsCall } from './action/tts-call';
import { lookup } from './action/lookup';
import { smsInbound } from './trigger/sms-inbound';

export const sevenAuth = PieceAuth.SecretText({
  description: 'The authentication to use to connect to seven',
  displayName: 'API key',
  required: true
});

export const seven = createPiece({
  actions: [smsSend, ttsCall, lookup],
  auth: sevenAuth,
  authors: ['seven-io'],
  displayName: 'seven',
  logoUrl: 'https://www.seven.io/wp-content/uploads/icon-green-bold.png',
  triggers: [smsInbound]
});
