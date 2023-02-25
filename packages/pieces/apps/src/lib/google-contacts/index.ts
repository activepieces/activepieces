import { createPiece } from '@activepieces/framework';
import { googleContactsAddContactAction } from './action/create-contact';
import { googleContactNewOrUpdatedContact } from './trigger/new-contact';

export const googleContacts = createPiece({
	name: 'google_contacts',
	logoUrl: 'https://cdn.activepieces.com/pieces/google_contacts.png',
	actions: [googleContactsAddContactAction],
	displayName: "Google Contacts",
	authors: ['abuaboud'],
	triggers: [googleContactNewOrUpdatedContact],
  version: '0.0.0',
});
