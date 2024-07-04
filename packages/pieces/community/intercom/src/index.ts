import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createContact } from './lib/actions/create-contact.action';
import { getOrCreateContact } from './lib/actions/create-or-get-contact.action';
import { sendMessage } from './lib/actions/send-message.action';
import crypto from 'node:crypto';
import { noteAddedToConversation } from './lib/triggers/note-added-to-conversation';

export const intercomAuth = PieceAuth.OAuth2({
  authUrl: 'https://app.intercom.com/oauth',
  tokenUrl: 'https://api.intercom.io/auth/eagle/token',
  required: true,
  scope: [],
});

export const intercom = createPiece({
  displayName: 'Intercom',
  description: 'Customer messaging platform for sales, marketing, and support',
  minimumSupportedRelease: '0.29.0', // introduction of new intercom APP_WEBHOOK
  logoUrl: 'https://cdn.activepieces.com/pieces/intercom.png',
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  auth: intercomAuth,
  triggers: [noteAddedToConversation],
  authors: [
    'kishanprmr',
    'MoShizzle',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
    'AdamSelene',
  ],
  actions: [
    getOrCreateContact,
    createContact,
    sendMessage,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.intercom.io',
      auth: intercomAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  events: {
    parseAndReply: ({ payload }) => {
      const payloadBody = payload.body as PayloadBody;
      return {
        event: payloadBody.topic,
        identifierValue: payloadBody.app_id,
      };
    },
    verify: ({ payload, webhookSecret }) => {
      const signature = payload.headers['x-hub-signature'];
      const hmac = crypto.createHmac('sha1', webhookSecret);
      hmac.update(`${payload.rawBody}`);
      const computedSignature = `sha1=${hmac.digest('hex')}`;
      return signature === computedSignature;
    },
  },
});

type PayloadBody = {
  type: string;
  topic: string;
  id: string;
  app_id: string;
};
