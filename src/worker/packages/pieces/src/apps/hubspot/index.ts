import {createPiece} from '../../framework/piece';
import { createHubspotContact } from './actions/create-contact/create-contact.action';


export const hubspot = createPiece({
	name: 'hubspot',
	displayName: "Hubspot",
	logoUrl: 'https://cdn.activepieces.com/components/hubspot.png',
	actions: [createHubspotContact],
	triggers: [],
});
