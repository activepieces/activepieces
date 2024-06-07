import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { addContact } from './lib/actions/add-contact';
import { deleteContacts } from './lib/actions/delete-contacts';
import { sendSms } from './lib/actions/send-sms';
import { sendMms } from './lib/actions/send-mms';
import { newContact } from './lib/triggers/new-contact';
import { newMms } from './lib/triggers/new-mms';
import { newVoicemail } from './lib/triggers/new-voicemail';

export const krispcallAuth = PieceAuth.CustomAuth({
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest<string[]>({
        method: HttpMethod.GET,
        url: 'https://automationapi.krispcall.com/api/v1/platform/activepiece/me',
        headers: {
          'X-API-KEY': auth.apiKey,
        },
      });
      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  },
  required: true,
});

export type krispcallAuth = {
  apiKey: string;
};

export const KrispCall = createPiece({
  displayName: 'Krispcall',
  auth: krispcallAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl:
    'https://krispcall.com/wp-content/uploads/2023/06/krispcall-favicon.svg',
  authors: [],
  actions: [addContact, deleteContacts, sendSms, sendMms],
  triggers: [newContact, newMms, newVoicemail],
});
