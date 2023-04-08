import packageJson from '../package.json';
import { createPiece } from '@activepieces/pieces-framework';
import { googleContactsAddContactAction } from './lib/action/create-contact';
import { googleContactNewOrUpdatedContact } from './lib/trigger/new-contact';

export const googleContacts = createPiece({
	name: 'google-contacts',
	logoUrl: 'https://cdn.activepieces.com/pieces/google-contacts.png',
	actions: [googleContactsAddContactAction],
	displayName: "Google Contacts",
	authors: ['abuaboud'],
	triggers: [googleContactNewOrUpdatedContact],
  version: packageJson.version,
});
