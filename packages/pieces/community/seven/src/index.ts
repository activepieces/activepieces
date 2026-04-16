import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { lookup } from './action/lookup'
import { sendRcsAction } from './action/rcs-send'
import { sendVoiceCallAction } from './action/send-voice-call'
import { sendSmsAction } from './action/sms-send'
import { sevenAuth } from './lib/auth'
import { smsInbound } from './trigger/sms-inbound'

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
})
