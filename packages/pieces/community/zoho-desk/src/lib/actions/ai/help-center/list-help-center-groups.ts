import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListHelpCenterGroupsOutputSchema } from '../../../output-schemas';

export const zohoDeskListHelpCenterGroupsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_help_center_groups',
	outputSchema: zohoDeskListHelpCenterGroupsOutputSchema,
	displayName: 'List Help Center Groups',
	description: 'Lists the user groups of a help center.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the help-center user groups with their IDs and names. Use it to get the group IDs for Add User Groups and Remove User Groups.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		helpCenterId: Property.ShortText({
			displayName: 'Help Center ID',
			description: 'Help center ID (from List Help Centers); needed when there is more than one.',
			required: false,
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, helpCenterId, from, limit } = context.propsValue;
		const groups = await zohoDeskApi.listGroups({
			auth: context.auth,
			orgId,
			helpCenterId,
			from,
			limit,
		});
		return { groups, count: groups.length };
	},
});
