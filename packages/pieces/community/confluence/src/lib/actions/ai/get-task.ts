import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceGetTaskOutputSchema } from '../../output-schemas';

export const getTaskAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_task',
	outputSchema: confluenceGetTaskOutputSchema,
	displayName: 'Get Task',
	description: 'Gets an inline task by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one Confluence inline task by ID: its status, body, page or blog post, assignee and dates.',
		idempotent: true,
	},
	props: {
		taskId: Property.ShortText({
			displayName: 'Task ID',
			description: 'Numeric task ID, from List Tasks.',
			required: true,
		}),
	},
	async run(context) {
		return await confluenceApi.getTask({
			auth: context.auth,
			taskId: context.propsValue.taskId,
			bodyFormat: 'storage',
		});
	},
});
