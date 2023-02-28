import {createPiece} from '@activepieces/framework';
import { hubSpotListsAddContactAction } from './lib/actions/add-contact-to-list-action';
import { createHubspotContact } from './lib/actions/create-contact.action';
import { hubSpotContactsCreateOrUpdateAction } from './lib/actions/create-or-update-contact-action';

export const hubspot = createPiece({
	name: 'hubspot',
	displayName: "HubSpot",
	logoUrl: 'https://cdn.activepieces.com/pieces/hubspot.png',
  version: '0.0.0',
	authors: ['khaledmashaly'],
	actions: [
    createHubspotContact,
    hubSpotContactsCreateOrUpdateAction,
    hubSpotListsAddContactAction,
  ],
	triggers: [],
});
