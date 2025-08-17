import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createContact } from './lib/actions/create-contact';
import { getCallSummary } from './lib/actions/get-call-summary';
import { getCallTranscription } from './lib/actions/get-call-transcription';
import { sendAMessage } from './lib/actions/send-a-message';
import { updateContact } from './lib/actions/update-contact';
import { callRecordingCompleted } from './lib/triggers/call-recording-completed';
import { incomingCallCompleted } from './lib/triggers/incoming-call-completed';
import { incomingMessageReceived } from './lib/triggers/incoming-message-received';
import { outgoingCallCompleted } from './lib/triggers/outgoing-call-completed';
import { outgoingMessageDelivered } from './lib/triggers/outgoing-message-delivered';
import { OpenPhoneAuth } from './lib/common/auth';

export const openphone = createPiece({
  displayName: 'Openphone',
  auth: OpenPhoneAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/openphone.png',
  authors: ['Sanket6652'],
  actions: [
    createContact,
    getCallSummary,
    getCallTranscription,
    sendAMessage,
    updateContact,
  ],
  triggers: [
    callRecordingCompleted,
    incomingCallCompleted,
    incomingMessageReceived,
    outgoingCallCompleted,
    outgoingMessageDelivered,
  ],
});
