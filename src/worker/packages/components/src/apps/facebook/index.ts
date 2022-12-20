import {createComponent} from '../../framework/component';
import { newLeads } from './Triggers/new-leads.trigger';

export const facebook = createComponent({
	name: 'facebook',
	displayName: "Facebook",
	logoUrl: 'https://cdn.activepieces.com/components/facebook/logo.png',
	actions: [],
	triggers: [newLeads],
});
