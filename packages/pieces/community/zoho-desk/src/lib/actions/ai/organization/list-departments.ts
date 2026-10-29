import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListDepartmentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListDepartmentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_departments',
	outputSchema: zohoDeskListDepartmentsOutputSchema,
	displayName: 'List Departments',
	description: 'Lists departments.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists departments; their `id` values feed every Department ID input. Page with From and Limit.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		searchStr: Property.ShortText({
			displayName: 'Search Text',
			description: 'Text to match in department names.',
			required: false,
		}),
		isEnabled: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Enabled',
			description: 'Yes returns only enabled departments.',
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, searchStr, isEnabled, from, limit } = context.propsValue;
		const departments = await zohoDeskApi.listDepartmentRecords({
			auth: context.auth,
			orgId,
			searchStr,
			isEnabled,
			from,
			limit,
		});
		return { departments, count: departments.length };
	},
});
