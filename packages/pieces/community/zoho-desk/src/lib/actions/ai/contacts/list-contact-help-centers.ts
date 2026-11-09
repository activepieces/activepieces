import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListContactHelpCentersOutputSchema } from '../../../output-schemas';

export const zohoDeskListContactHelpCentersAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_contact_help_centers',
	outputSchema: zohoDeskListContactHelpCentersOutputSchema,
	displayName: 'List Contact Help Centers',
	description: "Lists a contact's status in each help center.",
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists one contact's membership status in each help center (invited, active, pending approval), with the help center IDs.",
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		helpCenterId: Property.ShortText({
			displayName: 'Help Center ID',
			description: 'Only this help center.',
			required: false,
		}),
	},
	async run(context) {
		const { orgId, contactId, helpCenterId } = context.propsValue;
		const helpCenters = await zohoDeskApi.listContactHelpCenters({
			auth: context.auth,
			orgId,
			contactId,
			helpCenterId,
		});
		return { helpCenters, count: helpCenters.length };
	},
});
