import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { createContact } from './lib/actions/create-contact'
import { getCallSummary } from './lib/actions/get-call-summary'
import { sendMessage } from './lib/actions/send-message'
import { updateContact } from './lib/actions/update-contact'
import { openPhoneAuth } from './lib/auth'
import { callRecordingCompleted } from './lib/triggers/call-recording-completed'
import { incomingCallCompleted } from './lib/triggers/incoming-call-completed'
import { incomingMessageReceived } from './lib/triggers/incoming-message-received'
import { outgoingCallCompleted } from './lib/triggers/outgoing-call-completed'
import { outgoingMessageDelivered } from './lib/triggers/outgoing-message-delivered'

export const openPhone = createPiece({
    displayName: 'OpenPhone',
    auth: openPhoneAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/open-phone.png',
    authors: ['Ani-4x', 'onyedikachi-david'],
    actions: [sendMessage, createContact, updateContact, getCallSummary],
    triggers: [
        callRecordingCompleted,
        outgoingMessageDelivered,
        outgoingCallCompleted,
        incomingCallCompleted,
        incomingMessageReceived,
    ],
})
