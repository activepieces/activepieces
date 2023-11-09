import { createAction, Property } from "@activepieces/pieces-framework";
import { getLists, buildListDropdown } from "../common";
import { sendyAuth, SendyAuthType } from "../auth";

export const subscribeAction = createAction({
	name        : 'subscribe',
	auth        : sendyAuth,
	displayName : 'Subscribe',
	description : 'Add a new subscriber to a list',
	props       : {
		listId: Property.Dropdown({
			displayName : 'List',
			description : 'Select the list to subscribe to',
			required    : true,
			refreshers  : ['auth'],
			options     : async ({auth}) => await buildListDropdown(auth as SendyAuthType),
		}),
	},
	async run(context) {
		// const hiddenTextValue = context.propsValue.includeHidden ? 'yes' : 'no';
		// return await getLists(context.auth, context.propsValue.brandId, hiddenTextValue);
	},
});


