import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createContact } from './lib/actions/create-contact.action';
import { getOrCreateContact } from './lib/actions/create-or-get-contact.action';
import { sendMessage } from './lib/actions/send-message.action';
import crypto from 'node:crypto';
import { noteAddedToConversation } from './lib/triggers/note-added-to-conversation';
import { addNoteToConversation } from './lib/actions/add-note-to-conversation';
import { replyToConversation } from './lib/actions/reply-to-conversation';
import { newConversationFromUser } from './lib/triggers/new-conversation-from-user';
import { replyFromUser } from './lib/triggers/reply-from-user';
import { replyFromAdmin } from './lib/triggers/reply-from-admin';
import { conversationAssigned } from './lib/triggers/conversation-assigned';
import { conversationClosed } from './lib/triggers/conversation-closed';
import { conversationSnoozed } from './lib/triggers/conversation-snoozed';
import { conversationUnsnoozed } from './lib/triggers/conversation-unsnoozed';
import { conversationRated } from './lib/triggers/conversation-rated';
import { conversationPartTagged } from './lib/triggers/conversation-part-tagged';
import { findConversationAction } from './lib/actions/find-conversation';

export const intercomAuth = PieceAuth.OAuth2({
  authUrl: 'https://app.{region}.com/oauth',
  tokenUrl: 'https://api.{region}.io/auth/eagle/token',
  required: true,
  scope: [],
  props: {
    region: Property.StaticDropdown({
      displayName: 'Region',
      required: true,
      options: {
        options: [
          { label: 'US', value: 'intercom' },
          { label: 'EU', value: 'eu.intercom' },
          { label: 'AU', value: 'au.intercom' },
        ],
      },
    }),
  },
});

export const intercom = createPiece({
  displayName: 'Intercom',
  description: 'Customer messaging platform for sales, marketing, and support',
  minimumSupportedRelease: '0.29.0', // introduction of new intercom APP_WEBHOOK
  logoUrl: 'https://cdn.activepieces.com/pieces/intercom.png',
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  auth: intercomAuth,
  triggers: [
    newConversationFromUser,
    replyFromUser,
    replyFromAdmin,
    noteAddedToConversation,
    conversationAssigned,
    conversationClosed,
    conversationSnoozed,
    conversationUnsnoozed,
    conversationRated,
    conversationPartTagged,
  ],
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
    addNoteToConversation,
    replyToConversation,
    findConversationAction,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        `https://api.${(auth as OAuth2PropertyValue).props?.['region']}.io`,
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
