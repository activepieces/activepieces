import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendMessage } from './lib/actions/send-message';
import { createContact } from './lib/actions/create-contact';
import { updateContact } from './lib/actions/update-contact';
import { getCallSummary } from './lib/actions/get-call-summary';
import { callRecordingCompleted } from './lib/triggers/call-recording-completed';
import { outgoingMessageDelivered } from './lib/triggers/outgoing-message-delivered';
import { outgoingCallCompleted } from './lib/triggers/outgoing-call-completed';
import { incomingCallCompleted } from './lib/triggers/incoming-call-completed';
import { incomingMessageReceived } from './lib/triggers/incoming-message-received';

export const openPhoneAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description:
    'Enter your OpenPhone API key. You can generate one from the API tab in your workspace settings.',
});

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
});
