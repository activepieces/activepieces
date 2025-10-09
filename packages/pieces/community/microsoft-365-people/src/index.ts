import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { createContact } from './lib/actions/create-contact';
import { createContactFolder } from './lib/actions/create-contact-folder';
import { deleteContact } from './lib/actions/delete-contact';
import { getContactFolder } from './lib/actions/get-contact-folder';
import { searchContacts } from './lib/actions/search-contacts';
import { updateContact } from './lib/actions/update-contact';
import { microsoft365PeopleAuth } from './lib/common/auth';
import { newOrUpdatedContact } from './lib/triggers/new-or-updated-contact';

export const microsoft365People = createPiece({
  displayName: 'Microsoft 365 People',
  description: 'Manage contacts in Microsoft 365 People',
  auth: microsoft365PeopleAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-365-people.png',
  authors: ['LuizDMM'],
  actions: [
    createContact,
    deleteContact,
    updateContact,
    createContactFolder,
    getContactFolder,
    // Search Actions
    searchContacts,
    // Custom API call
    createCustomApiCallAction({
			auth: microsoft365PeopleAuth,
			baseUrl: () => 'https://graph.microsoft.com/v1.0/',
			authMapping: async (auth) => ({
				Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
			}),
		}),
  ],
  triggers: [newOrUpdatedContact],
});
