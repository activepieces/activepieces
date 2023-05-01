import packageJson from '../package.json';
import { createPiece, PieceType } from '@activepieces/pieces-framework';
import { hubSpotListsAddContactAction } from './lib/actions/add-contact-to-list-action';
import { createHubspotContact } from './lib/actions/create-contact.action';
import { hubSpotContactsCreateOrUpdateAction } from './lib/actions/create-or-update-contact-action';

export const hubspot = createPiece({
	name: 'hubspot',
	displayName: "HubSpot",
	logoUrl: 'https://cdn.activepieces.com/pieces/hubspot.png',
	version: packageJson.version,
	type: PieceType.PUBLIC,
	authors: ['khaledmashaly'],
	actions: [
		createHubspotContact,
		hubSpotContactsCreateOrUpdateAction,
		hubSpotListsAddContactAction,
	],
	triggers: [],
});
