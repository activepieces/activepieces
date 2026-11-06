import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetDepartmentOutputSchema } from '../../../output-schemas';

export const zohoDeskGetDepartmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_department',
	outputSchema: zohoDeskGetDepartmentOutputSchema,
	displayName: 'Get Department',
	description: 'Gets a department by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one department by ID with its name, description, help-center visibility and agent IDs.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: true }),
	},
	async run(context) {
		const { orgId, departmentId } = context.propsValue;
		return await zohoDeskApi.getDepartment({ auth: context.auth, orgId, departmentId });
	},
});
