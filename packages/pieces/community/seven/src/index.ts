import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendSmsAction } from './action/sms-send';
import { sendRcsAction } from './action/rcs-send';
import { sendVoiceCallAction } from './action/send-voice-call';
import { lookup } from './action/lookup';
import { smsInbound } from './trigger/sms-inbound';
import { PieceCategory } from '@activepieces/shared';

export const sevenAuth = PieceAuth.SecretText({
  description:
    'You can find your API key in [Developer Menu](https://app.seven.io/developer).',
  displayName: 'API key',
  required: true,
});

export const seven = createPiece({
  displayName: 'seven',
  description: 'Business Messaging Gateway',
  auth: sevenAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/seven.jpg',
  categories: [PieceCategory.MARKETING],
  authors: ['seven-io'],
  actions: [sendSmsAction, sendVoiceCallAction, lookup, sendRcsAction],
  triggers: [smsInbound],
});
