import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
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
  description: `To find your credentials:
1. Sign in to the [Twilio Console](https://console.twilio.com).
2. On the home page, find **Account Info**.
3. Copy the **Account SID** and the **Auth Token** (click **Show** to reveal it).`,

  required: true,
  username: {
    displayName: 'Account SID',
    description: 'Starts with AC. Shown under Account Info in the Twilio Console.',
  },
  password: {
    displayName: 'Auth Token',
    description: 'Click Show under Account Info in the Twilio Console to reveal it.',
  },
});

export const twilio = createPiece({
  displayName: 'Twilio',
  description:
    'Cloud communications platform for building SMS, Voice & Messaging applications',

  minimumSupportedRelease: '0.88.2',
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
          `${auth.username}:${
            auth.password
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
