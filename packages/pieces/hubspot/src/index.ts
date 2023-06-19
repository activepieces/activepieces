import { createPiece } from '@activepieces/pieces-framework';
import { hubSpotListsAddContactAction } from './lib/actions/add-contact-to-list-action';
import { createHubspotContact } from './lib/actions/create-contact.action';
import { hubSpotContactsCreateOrUpdateAction } from './lib/actions/create-or-update-contact-action';
import { newTaskAdded } from './lib/triggers/new-task-added'

export const hubspot = createPiece({
	displayName: "HubSpot",
	logoUrl: 'https://cdn.activepieces.com/pieces/hubspot.png',
	authors: ['khaledmashaly', 'MoShizzle'],
	actions: [
		createHubspotContact,
		hubSpotContactsCreateOrUpdateAction,
		hubSpotListsAddContactAction,
	],
	triggers: [
        newTaskAdded
    ],
});
