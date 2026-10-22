import { createCustomApiCallAction, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { callPlivoApi } from './lib/common';
import { plivoSendSms } from './lib/action/send-sms';
import { plivoMakeCall } from './lib/action/make-call';
import { plivoLookupNumber } from './lib/action/lookup-number';
import { plivoAnswerCall } from './lib/action/answer-call';
import { plivoNewIncomingSms } from './lib/trigger/new-incoming-sms';
import { plivoNewIncomingCall } from './lib/trigger/new-incoming-call';
import { plivoCompletedCall } from './lib/trigger/completed-call';

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
  validate: async ({ auth }) => {
    try {
      await callPlivoApi(HttpMethod.GET, '', {
        auth_id: auth.username,
        auth_token: auth.password,
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Could not reach the Plivo account with these details. Check the Auth ID and Auth Token in the Plivo console.',
      };
    }
  },
});

export const plivo = createPiece({
  displayName: 'Plivo',
  description:
    'Send SMS, place voice calls, look up phone numbers, and trigger flows from inbound Plivo messages and calls',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/plivo.png',
  auth: plivoAuth,
  categories: [PieceCategory.COMMUNICATION],
  actions: [
    plivoSendSms,
    plivoMakeCall,
    plivoLookupNumber,
    plivoAnswerCall,
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
  triggers: [plivoNewIncomingSms, plivoNewIncomingCall, plivoCompletedCall],
});
