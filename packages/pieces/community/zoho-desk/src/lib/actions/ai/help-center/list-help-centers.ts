import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListHelpCentersOutputSchema } from '../../../output-schemas';

export const zohoDeskListHelpCentersAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_help_centers',
	outputSchema: zohoDeskListHelpCentersOutputSchema,
	displayName: 'List Help Centers',
	description: 'Lists the help centers (customer portals) of the organization.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the help centers of the organization with their IDs, names and URLs. Use it to get the help center ID that user, group, label and invite actions take.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, from, limit } = context.propsValue;
		const helpCenters = await zohoDeskApi.listHelpCenters({
			auth: context.auth,
			orgId,
			from,
			limit,
		});
		return { helpCenters, count: helpCenters.length };
	},
});
