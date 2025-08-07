import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { openphoneAuth } from './common/auth';
import { 
  callRecordingCompletedTrigger,
  outgoingMessageDeliveredTrigger,
  outgoingCallCompletedTrigger,
  incomingCallCompletedTrigger,
  incomingMessageReceivedTrigger
} from './triggers';
import {
  sendMessageAction,
  createContactAction,
  updateContactAction,
  getCallSummaryAction,
  getCallTranscriptionAction
} from './actions';

export const openphone = createPiece({
  displayName: 'OpenPhone',
  description: 'Modern business phone system with voice calls, SMS/MMS messaging, and CRM features',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/openphone.png',
  categories: [PieceCategory.COMMUNICATION],
  auth: openphoneAuth,
  authors: ['OpenPhone Integration Team'],
  triggers: [
    callRecordingCompletedTrigger,
    outgoingMessageDeliveredTrigger,
    outgoingCallCompletedTrigger,
    incomingCallCompletedTrigger,
    incomingMessageReceivedTrigger,
  ],
  actions: [
    sendMessageAction,
    createContactAction,
    updateContactAction,
    getCallSummaryAction,
    getCallTranscriptionAction,
  ],
});