import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListDepartmentTeamsOutputSchema } from '../../../output-schemas';

export const zohoDeskListDepartmentTeamsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_department_teams',
	outputSchema: zohoDeskListDepartmentTeamsOutputSchema,
	displayName: 'List Department Teams',
	description: 'Lists the teams in a department.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the teams in one department; a team `id` feeds Get Team and List Team Members.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: true }),
		searchStr: Property.ShortText({
			displayName: 'Search Text',
			description: 'Text to match in team names.',
			required: false,
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, departmentId, searchStr, from, limit } = context.propsValue;
		return await zohoDeskApi.listDepartmentTeams({
			auth: context.auth,
			orgId,
			departmentId,
			searchStr,
			from,
			limit,
		});
	},
});
