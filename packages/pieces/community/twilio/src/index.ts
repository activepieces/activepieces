import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { twilioSendSms } from './lib/action/send-sms';
import { twilioNewIncomingSms } from './lib/trigger/new-incoming-sms';

export const twilioAuth = PieceAuth.BasicAuth({
  description: 'The authentication to use to connect to Twilio',

  required: true,
  username: {
    displayName: 'Account SID',
    description: 'The account SID to use to connect to Twilio',
  },
  password: {
    displayName: 'Auth token',
    description: 'The auth token to use to connect to Twilio',
  },
});

export const twilio = createPiece({
  displayName: 'Twilio',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/twilio.png',
  auth: twilioAuth,
  categories: [PieceCategory.IT_OPERATIONS],
  actions: [twilioSendSms],
  authors: ['abuaboud'],
  triggers: [twilioNewIncomingSms],
});
