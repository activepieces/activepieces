import { PieceAuth, createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { lookup } from './action/lookup'
import { sendVoiceCallAction } from './action/send-voice-call'
import { sendSmsAction } from './action/sms-send'
import { smsInbound } from './trigger/sms-inbound'

export const sevenAuth = PieceAuth.SecretText({
  description: 'You can find your API key in [Developer Menu](https://app.seven.io/developer).',
  displayName: 'API key',
  required: true,
})

export const seven = createPiece({
  displayName: 'seven',
  description: 'Business Messaging Gateway',
  auth: sevenAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/seven.jpg',
  categories: [PieceCategory.MARKETING],
  authors: ['seven-io'],
  actions: [sendSmsAction, sendVoiceCallAction, lookup],
  triggers: [smsInbound],
})
