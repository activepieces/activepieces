import {createComponent} from '../../framework/component';
import { createHubspotContact } from './actions/create-contact/create-contact.action';


export const slack = createComponent({
	name: 'hubspot',
	displayName: "Hubspot",
	logoUrl: 'https://cdn.activepieces.com/components/hubspot/logo.png',
	actions: [createHubspotContact],
	triggers: [],
});
