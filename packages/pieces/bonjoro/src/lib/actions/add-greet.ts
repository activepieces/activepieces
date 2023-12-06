import { createAction, Property } from "@activepieces/pieces-framework";
import { addGreet } from "../api";
import { bonjoroAuth, BonjoroAuthType } from "../auth";
import { buildCampaignDropdown, buildTemplateDropdown, buildUserDropdown } from "../props";

export const addGreetAction = createAction({
	name        : 'addGreet',
	auth        : bonjoroAuth,
	displayName : 'Create a Greet',
	description : 'Create a new Greet in Bonjoro',
	props       : {
		email: Property.ShortText({
			displayName : 'Email',
			description : 'List of emails to send the greet to',
			required    : true,
		}),
		note: Property.LongText({
			displayName : 'Note',
			description : 'Note to send with the greet',
			required    : true,
		}),
		assignee: Property.Dropdown({
			displayName : 'Assignee',
			description : 'Who to assign the greet to',
			required    : false,
			refreshers  : ['auth'],
			options     : async ({auth}) => await buildUserDropdown(auth as BonjoroAuthType),
		}),
		campaign: Property.Dropdown({
			displayName : 'Campaign',
			description : 'The campaign to add the greet to',
			required    : false,
			refreshers  : ['auth'],
			options     : async ({auth}) => await buildCampaignDropdown(auth as BonjoroAuthType),
		}),
		template: Property.Dropdown({
			displayName : 'Template',
			description : 'The template to use for the greet',
			required    : false,
			refreshers  : ['auth'],
			options     : async ({auth}) => await buildTemplateDropdown(auth as BonjoroAuthType),
		}),
	},
	async run(context) {
		return await addGreet(context.auth, {
			profiles    : context.propsValue.email.split(',').map(e => e.trim()),
			note        : context.propsValue.note,
			assignee_id : context.propsValue.assignee,
			campaign_id : context.propsValue.campaign,
			template_id : context.propsValue.template,
		});
	},
});


