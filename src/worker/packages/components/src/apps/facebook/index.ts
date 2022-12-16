import {createComponent} from '../../framework/component';
import {newFacebookLead} from "./trigger/new-lead";

export const facebook = createComponent({
	name: 'Facebook',
	logoUrl: 'https://cdn.activepieces.com/components/facebook/logo.png',
	actions: [],
	triggers: [newFacebookLead],
});
