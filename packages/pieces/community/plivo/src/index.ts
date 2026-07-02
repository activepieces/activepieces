import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { plivoSendSms } from './lib/action/send-sms';
import { plivoMakeCall } from './lib/action/make-call';
import { plivoSendWhatsapp } from './lib/action/send-whatsapp';
import { plivoNumberLookup } from './lib/action/number-lookup';
import { plivoNewIncomingSms } from './lib/trigger/new-incoming-sms';

export const plivoAuth = PieceAuth.BasicAuth({
  description: 'The authentication to use to connect to Plivo',

  required: true,
  username: {
    displayName: 'Auth ID',
    description: 'The Auth ID to use to connect to Plivo',
  },
  password: {
    displayName: 'Auth Token',
    description: 'The Auth Token to use to connect to Plivo',
  },
});

export const plivo = createPiece({
  displayName: 'Plivo',
  description:
    'Cloud communications platform for building SMS, Voice & WhatsApp applications',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/plivo.png',
  auth: plivoAuth,
  categories: [PieceCategory.COMMUNICATION],
  actions: [
    plivoSendSms,
    plivoMakeCall,
    plivoSendWhatsapp,
    plivoNumberLookup,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        `https://api.plivo.com/v1/Account/${auth?.username}`,
      auth: plivoAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(
          `${auth.username}:${auth.password}`
        ).toString('base64')}`,
      }),
    }),
  ],
  authors: ['sarveshpatil-plivo'],
  triggers: [plivoNewIncomingSms],
});
