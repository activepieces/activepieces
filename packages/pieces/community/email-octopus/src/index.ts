import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { addOrUpdateContact } from './lib/actions/add-or-update-contact';
import { addTagToContact } from './lib/actions/add-tag-to-contact';
import { createList } from './lib/actions/create-list';
import { findContact } from './lib/actions/find-contact';
import { removeTagFromContact } from './lib/actions/remove-tag-from-contact';
import { unsubscribeContact } from './lib/actions/unsubscribe-contact';
import { updateContactEmailAddress } from './lib/actions/update-contact-email-address';

export const octopusauth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Email Octopus API key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.emailoctopus.com/lists',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth}`,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});

export const emailOctopus = createPiece({
  displayName: "Email Octopus",
  auth: octopusauth, 
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/email-octopus.png",
  authors: [],
  actions: [
    addOrUpdateContact,
    addTagToContact,
    createList,
    findContact,
    removeTagFromContact,
    unsubscribeContact,
    updateContactEmailAddress,
  ],
  triggers: [],
});