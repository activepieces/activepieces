// Entry point for the Systeme.io piece
import { createPiece } from '@activepieces/pieces-framework';
import { createContact } from './lib/actions/create-contact';
import { updateContact } from './lib/actions/update-contact';
import { addTagToContact } from './lib/actions/add-tag-to-contact';
import { removeTagFromContact } from './lib/actions/remove-tag-from-contact';
import { findContactByEmail } from './lib/actions/find-contact-by-email';
import { systemeioAuth } from './lib/auth';
import { newContact } from './lib/triggers/new-contact';
import { newSale } from './lib/triggers/new-sale';
import { newTagAdded } from './lib/triggers/new-tag-added';

export const systemeio = createPiece({
  displayName: 'Systeme.io',
  description: 'All-in-one marketing platform integration for Activepieces',
  logoUrl: '', // Add logo if available
  authors: ['your-github-username'],
  auth: systemeioAuth,
  actions: [
    createContact,
    updateContact,
    addTagToContact,
    removeTagFromContact,
    findContactByEmail,
  ],
  triggers: [
    newContact,
    newSale,
    newTagAdded,
  ],
});

export default systemeio; 