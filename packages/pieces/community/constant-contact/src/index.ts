import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { addContactToList } from './lib/actions/add-contact-to-list';
import { addTagToContact } from './lib/actions/add-tag-to-contact';
import { constantContactAiActions } from './lib/actions/ai';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';
import { deleteContact } from './lib/actions/delete-contact';
import { findContact } from './lib/actions/find-contact';
import { removeContactFromList } from './lib/actions/remove-contact-from-list';
import { updateContact } from './lib/actions/update-contact';
import { constantContactAuth } from './lib/auth';
import { CONSTANT_CONTACT_API_URL } from './lib/common/client';
import { contactUnsubscribedTrigger } from './lib/triggers/contact-unsubscribed';
import { newContactTrigger } from './lib/triggers/new-contact';
import { updatedContactTrigger } from './lib/triggers/updated-contact';

export const constantContact = createPiece({
  displayName: 'Constant Contact',
  description: 'Email marketing for small businesses',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/constant-contact.png',
  categories: [PieceCategory.MARKETING],
  authors: ['kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'OdaiAhmed99'],
  auth: constantContactAuth,
  actions: [
    createOrUpdateContact,
    findContact,
    updateContact,
    addContactToList,
    removeContactFromList,
    addTagToContact,
    deleteContact,
    ...constantContactAiActions,
    createCustomApiCallAction({
      baseUrl: () => CONSTANT_CONTACT_API_URL,
      auth: constantContactAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [newContactTrigger, updatedContactTrigger, contactUnsubscribedTrigger],
});
