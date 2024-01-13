
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { twilioSendSms } from './lib/action/send-sms';
import { twilioMakeCall } from './lib/action/make-call';
import { generateTwiml } from './lib/action/generate-twiml'
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
  }
})
export const twilioV2 = createPiece({
  displayName: "Twilio-v2",
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/twilio.png',
  auth: twilioAuth,
  actions: [twilioSendSms, twilioMakeCall, generateTwiml],
  authors: ['abuaboud'],
  triggers: [twilioNewIncomingSms],
});
