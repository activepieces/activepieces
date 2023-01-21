import {createPiece} from '../../framework/piece';
import { googleContactsAddContactAction } from './action/create_contact';

export const googleContacts = createPiece({
	name: 'google_contacts',
	logoUrl: 'https://cdn.activepieces.com/pieces/googleSheets.png',
	actions: [googleContactsAddContactAction],
    displayName:"Google Contacts",
	triggers: [],
});