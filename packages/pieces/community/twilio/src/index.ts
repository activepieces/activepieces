import { createCustomApiCallAction } from '@activepieces/pieces-common';
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
  description:
    'Cloud communications platform for building SMS, Voice & Messaging applications',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/twilio.png',
  auth: twilioAuth,
  categories: [PieceCategory.COMMUNICATION],
  actions: [
    twilioSendSms,
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
  triggers: [twilioNewIncomingSms],
});
