import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListSupportPlansOutputSchema } from '../../../output-schemas';

export const zohoDeskListSupportPlansAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_support_plans',
	outputSchema: zohoDeskListSupportPlansOutputSchema,
	displayName: 'List Support Plans',
	description: 'Lists the support plans of a department.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the support plans of one department with their IDs, names and linked SLAs. Use it to get the support plan ID that Create Contract needs.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: true }),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only plans in this status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'ACTIVE', value: 'ACTIVE' },
					{ label: 'DISCONTINUED', value: 'DISCONTINUED' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, departmentId, status, from, limit } = context.propsValue;
		const supportPlans = await zohoDeskApi.listSupportPlans({
			auth: context.auth,
			orgId,
			departmentId,
			status,
			from,
			limit,
		});
		return { supportPlans, count: supportPlans.length };
	},
});
