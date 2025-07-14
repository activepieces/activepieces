import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { sendMms } from './lib/actions/send-mms';
import { sendSms } from './lib/actions/send-sms';
import { createContact } from './lib/actions/create-contact';
import { updateContact } from './lib/actions/update-contact';
import { deleteContact } from './lib/actions/delete-contact';
import { createContactList } from './lib/actions/create-contact-list';
import { searchContactByEmail } from './lib/actions/search-contact-by-email';
import { searchContactByPhone } from './lib/actions/search-contact-by-phone';
import { searchContactLists } from './lib/actions/search-contact-lists';
import { newIncomingSms } from './lib/triggers/new-incoming-sms';
import { makeRequest } from './lib/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const clicksendAuth = PieceAuth.BasicAuth({
  required: true,
  description: `username: Your API username
             password: Your API key You can get your API credentials by clicking 'API Credentials' on the top right of the dashboard.`,
  username: Property.ShortText({
    displayName: 'Username',
    description: 'Your ClickSend API username',
    required: true,
  }),
  password: Property.ShortText({
    displayName: 'API Key',
    description: 'Your ClickSend API key',
    required: true,
  }),
  validate: async ({ auth }) => {
    if (auth) {
      try {
        const { username, password } = auth;
        const apiKey = `${username}:${password}`;
        await makeRequest(apiKey, HttpMethod.GET, '/account')
        return {
          valid: true,
        }
      } catch {
        return {
          valid: false,
          error: 'Invalid Api Key'
        }
      }

    }
    return {
      valid: false,
      error: 'Enter Api Key'
    }
  }
});

export const clicksend = createPiece({
  displayName: 'Clicksend',
  auth: clicksendAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/clicksend.png',
  authors: ['Sanket6652'],
  actions: [
    sendMms,
    sendSms,
    createContact,
    updateContact,
    deleteContact,
    createContactList,
    searchContactByEmail,
    searchContactByPhone,
    searchContactLists
  ],
  triggers: [newIncomingSms],
});
