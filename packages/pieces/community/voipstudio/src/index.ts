import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { voipstudioAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';
import { createContact } from './lib/actions/create-contact';
import { makeACallToLead } from './lib/actions/make-a-call-to-lead';
import { makeACall } from './lib/actions/make-a-call';
import { makeAWebcall } from './lib/actions/make-a-webcall';
import { sendSms } from './lib/actions/send-sms';

export const voipstudio = createPiece({
  displayName: 'Voipstudio',
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
    sendSms
  ],
  triggers: [],
});
