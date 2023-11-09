import { createAction, Property } from "@activepieces/pieces-framework";
import { sendyAuth, getLists, buildBrandDropdown, SendyAuthType } from "../common";

export const getListsAction = createAction({
	name        : 'get-lists',
	auth        : sendyAuth,
	displayName : 'Get Lists',
	description : 'Get the Lists for a Brand',
	props       : {
		brand: Property.Dropdown({
			displayName : 'Brand',
			description : 'Select the brand to get lists for',
			required    : true,
			refreshers  : ['auth'],
			options     : async ({auth}) => await buildBrandDropdown(auth as SendyAuthType),
		})
	},
	async run(context) {
		return await getLists(context.auth);
	},
});


