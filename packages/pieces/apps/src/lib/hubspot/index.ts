import {createPiece} from '@activepieces/framework';
import { hubSpotListsAddContactAction } from './actions/add-contact-to-list-action';
import { createHubspotContact } from './actions/create-contact.action';
import { hubSpotContactsCreateOrUpdateAction } from './actions/create-or-update-contact-action';

export const hubspot = createPiece({
	name: 'hubspot',
	displayName: "HubSpot",
	logoUrl: 'https://cdn.activepieces.com/pieces/hubspot.png',
	authors: ['khaledmashaly'],
	actions: [
    createHubspotContact,
    hubSpotContactsCreateOrUpdateAction,
    hubSpotListsAddContactAction,
  ],
	triggers: [],
});
