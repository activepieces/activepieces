import packageJson from '../package.json';
import { createPiece } from '@activepieces/framework';
import { googleContactsAddContactAction } from './lib/action/create-contact';
import { googleContactNewOrUpdatedContact } from './lib/trigger/new-contact';

export const googleContacts = createPiece({
	name: 'google_contacts',
	logoUrl: 'https://cdn.activepieces.com/pieces/google_contacts.png',
	actions: [googleContactsAddContactAction],
	displayName: "Google Contacts",
	authors: ['abuaboud'],
	triggers: [googleContactNewOrUpdatedContact],
  version: packageJson.version,
});
