import { createPiece } from '@activepieces/pieces-framework';
import { googleContactsAddContactAction } from './lib/action/create-contact';
import { googleContactNewOrUpdatedContact } from './lib/trigger/new-contact';

export const googleContacts = createPiece({
	logoUrl: 'https://cdn.activepieces.com/pieces/google-contacts.png',
	actions: [googleContactsAddContactAction],
	displayName: "Google Contacts",
	authors: ['abuaboud', 'abdallah-alwarawreh'],
	triggers: [googleContactNewOrUpdatedContact],
});
