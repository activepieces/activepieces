import { createPiece } from '@activepieces/pieces-framework';
import { microsoft365Auth } from './lib/common/auth';
import { createAContact } from './lib/actions/create-a-contact';
import { updateAContact } from './lib/actions/update-a-contact';
import { createAContactFolder } from './lib/actions/create-a-contact-folder';
import { deleteAContact } from './lib/actions/delete-a-contact';
import { deleteAContactFolder } from './lib/actions/delete-a-contact-folder';
import { searchContacts } from './lib/actions/search-contacts';

export const microsoft365People = createPiece({
  displayName: 'Microsoft-365-people',
  auth: microsoft365Auth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-365-people.png',
  authors: ['Sanket6652'],
  actions: [
    createAContact,
    createAContactFolder,
    deleteAContact,
    deleteAContactFolder,
    searchContacts,
    updateAContact,
  ],
  triggers: [],
});
