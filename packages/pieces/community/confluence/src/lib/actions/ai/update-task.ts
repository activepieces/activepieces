import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceUpdateTaskOutputSchema } from '../../output-schemas';

export const updateTaskAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_update_task',
	outputSchema: confluenceUpdateTaskOutputSchema,
	displayName: 'Update Task',
	description: 'Marks an inline task complete or incomplete.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Marks a Confluence inline task complete or incomplete, keeping its other fields. Get the task ID from List Tasks. Idempotent: setting the same status again leaves the task unchanged.',
		idempotent: true,
	},
	props: {
		taskId: Property.ShortText({
			displayName: 'Task ID',
			description: 'Numeric task ID, from List Tasks.',
			required: true,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Complete', value: 'complete' },
					{ label: 'Incomplete', value: 'incomplete' },
				],
			},
		}),
	},
	async run(context) {
		const { taskId, status } = context.propsValue;
		const task = await confluenceApi.getTask({ auth: context.auth, taskId });
		return await confluenceApi.updateTask({ auth: context.auth, task, status });
	},
});
