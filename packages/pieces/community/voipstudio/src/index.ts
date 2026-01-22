import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { voipstudioAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';
import { createContact } from './lib/actions/create-contact';
import { makeACallToLead } from './lib/actions/make-a-call-to-lead';
import { makeACall } from './lib/actions/make-a-call';
import { makeAWebcall } from './lib/actions/make-a-webcall';
import { sendSms } from './lib/actions/send-sms';
import { callConnected } from './lib/triggers/call-connected';
import { callEnded } from './lib/triggers/call-ended';
import { callTracking } from './lib/triggers/call-tracking';
import { dtmfReceived } from './lib/triggers/dtmf-received';
import { missedCall } from './lib/triggers/missed-call';
import { newCallRecording } from './lib/triggers/new-call-recording';
import { smsReceived } from './lib/triggers/sms-received';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/client';

export const voipstudio = createPiece({
  displayName: 'VoIPstudio',
  auth: voipstudioAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/voipstudio.png',
  categories: [PieceCategory.COMMUNICATION],
  description:
    'VoIPstudio is a complete business phone system and scalable call center',
  authors: ['sanket-a11y'],
  actions: [
    createContact,
    makeACallToLead,
    makeACall,
    makeAWebcall,
    sendSms,
    createCustomApiCallAction({
      auth: voipstudioAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => ({
        'X-Auth-Token': auth.secret_text,
      }),
    }),
  ],
  triggers: [
    callConnected,
    callEnded,
    callTracking,
    dtmfReceived,
    missedCall,
    newCallRecording,
    smsReceived,
  ],
});
