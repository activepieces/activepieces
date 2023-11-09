import { createAction, Property } from "@activepieces/pieces-framework";
import { createCampaign } from "../api";
import { buildListDropdown } from "../props";
import { sendyAuth, SendyAuthType } from "../auth";

export const createCampaignAction = createAction({
	name        : 'createCampaign',
	auth        : sendyAuth,
	displayName : 'Create Campaign',
	description : 'Create a new campaign',
	props       : {
		lists: Property.MultiSelectDropdown({
			displayName : 'List',
			description : 'Select lists to send the campaign to',
			required    : false,
			refreshers  : ['auth'],
			options     : async ({auth}) => await buildListDropdown(auth as SendyAuthType),
		}),
	},
	async run(context) {
		return await createCampaign(context.auth, {
			list_ids : context.propsValue.lists?.join(','),
		});
	},
});


