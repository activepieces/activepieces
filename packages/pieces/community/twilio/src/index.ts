import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { twilioSendSms } from './lib/action/send-sms';
import { twilioNewIncomingSms } from './lib/trigger/new-incoming-sms';
import { twilioPhoneNumberLookup } from './lib/action/phone-number-lookup';
import { twilioMakeCall } from './lib/action/make-call';
import { twilioGetMessage } from './lib/action/get-message';
import { twilioDownloadRecordingMedia } from './lib/action/download-recording-media';
import { twilioNewPhoneNumber } from './lib/trigger/new-phone-number';
import { twilioNewRecording } from './lib/trigger/new-recording';
import { twilioNewTranscription } from './lib/trigger/new-transcription';
import { twilioNewCall } from './lib/trigger/new-call';

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
  description:
    'Cloud communications platform for building SMS, Voice & Messaging applications',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/twilio.png',
  auth: twilioAuth,
  categories: [PieceCategory.COMMUNICATION],
  actions: [
    twilioSendSms,
    twilioPhoneNumberLookup,
    twilioMakeCall,
    twilioGetMessage,
    twilioDownloadRecordingMedia,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.twilio.com/2010-04-01',
      auth: twilioAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(
          `${(auth as { username: string }).username}:${
            (auth as { password: string }).password
          }`
        ).toString('base64')}`,
      }),
    }),
  ],
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  triggers: [twilioNewIncomingSms,
    twilioNewPhoneNumber,
    twilioNewRecording,
    twilioNewTranscription,
    twilioNewCall
  ],
});
