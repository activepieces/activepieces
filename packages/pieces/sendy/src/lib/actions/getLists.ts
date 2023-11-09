import { createAction, Property } from "@activepieces/pieces-framework";
import { getLists } from "../api";
import { sendyAuth } from "../auth";

export const getListsAction = createAction({
	name        : 'getLists',
	auth        : sendyAuth,
	displayName : 'Get Lists',
	description : 'Get the Lists for a Brand',
	props       : {
		// brandId: Property.Dropdown({
		// 	displayName : 'Brand',
		// 	description : 'Select the brand to get lists for',
		// 	required    : true,
		// 	refreshers  : ['auth'],
		// 	options     : async ({auth}) => await buildBrandDropdown(auth as SendyAuthType),
		// }),
		includeHidden: Property.Checkbox({
			displayName  : 'Include Hidden Lists',
			description  : 'Include hidden lists in the results',
			required     : false,
			defaultValue : false,
		}),
	},
	async run(context) {
		return await getLists(context.auth, {
			include_hidden : context.propsValue.includeHidden ? 'yes' : 'no',
		});
	},
});


