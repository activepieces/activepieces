import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceGetLongTaskOutputSchema } from '../../output-schemas';

export const getLongTaskAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_long_task',
	outputSchema: confluenceGetLongTaskOutputSchema,
	displayName: 'Get Long Task Status',
	description: 'Gets the status of a long-running task.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads the status of a long-running Confluence task once: percent complete, finished and successful flags, and any messages or errors. Use it with the task ID returned by Archive Pages or Delete Space; call it again until finished is true.',
		idempotent: true,
	},
	props: {
		taskId: Property.ShortText({
			displayName: 'Task ID',
			description: 'Long task ID returned by Archive Pages or Delete Space.',
			required: true,
		}),
	},
	async run(context) {
		return await confluenceApi.getLongTask({
			auth: context.auth,
			taskId: context.propsValue.taskId,
		});
	},
});
