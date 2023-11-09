import { createAction, Property } from "@activepieces/pieces-framework";
import { sendyAuth, getLists, buildBrandDropdown, SendyAuthType } from "../common";

export const getListsAction = createAction({
	name        : 'get-lists',
	auth        : sendyAuth,
	displayName : 'Get Lists',
	description : 'Get the Lists for a Brand',
	props       : {
		brandId: Property.Dropdown({
			displayName : 'Brand',
			description : 'Select the brand to get lists for',
			required    : true,
			refreshers  : ['auth'],
			options     : async ({auth}) => await buildBrandDropdown(auth as SendyAuthType),
		}),
		includeHidden: Property.Checkbox({
			displayName  : 'Include Hidden Lists',
			description  : 'Include hidden lists in the results',
			required     : false,
			defaultValue : false,
		}),
	},
	async run(context) {
		const hiddenTextValue = context.propsValue.includeHidden ? 'yes' : 'no';
		return await getLists(context.auth, context.propsValue.brandId, hiddenTextValue);
	},
});


