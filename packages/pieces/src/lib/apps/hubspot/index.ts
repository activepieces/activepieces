import {createPiece} from '../../framework/piece';
import { createHubspotContact } from './actions/create-contact.action';


export const hubspot = createPiece({
	name: 'hubspot',
	displayName: "Hubspot",
	logoUrl: 'https://cdn.activepieces.com/pieces/hubspot.png',
	actions: [createHubspotContact],
	triggers: [],
});
