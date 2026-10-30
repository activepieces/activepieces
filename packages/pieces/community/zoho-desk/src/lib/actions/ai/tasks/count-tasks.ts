import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCountAccountsOutputSchema } from '../../../output-schemas';

export const zohoDeskCountTasksAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_count_tasks',
	outputSchema: zohoDeskCountAccountsOutputSchema,
	displayName: 'Count Tasks',
	description: 'Counts the tasks in a view.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Returns the number of tasks in one task view and department.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		viewId: Property.ShortText({
			displayName: 'View ID',
			description: 'Task view ID (from List Views, module tasks).',
			required: true,
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: true }),
	},
	async run(context) {
		const { orgId, viewId, departmentId } = context.propsValue;
		return await zohoDeskApi.countTasks({ auth: context.auth, orgId, viewId, departmentId });
	},
});
