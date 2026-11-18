import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCountAgentsOutputSchema } from '../../../output-schemas';

export const zohoDeskCountDepartmentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_count_departments',
	outputSchema: zohoDeskCountAgentsOutputSchema,
	displayName: 'Count Departments',
	description: 'Counts departments.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Returns the number of departments, optionally only enabled ones.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		isEnabled: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Enabled',
			description: 'Yes counts only enabled departments.',
		}),
	},
	async run(context) {
		const { orgId, isEnabled } = context.propsValue;
		return await zohoDeskApi.countDepartments({ auth: context.auth, orgId, isEnabled });
	},
});
