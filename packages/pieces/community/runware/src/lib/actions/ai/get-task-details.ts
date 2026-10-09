import { createAction } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';

export const getTaskDetailsAction = createAction({
	auth: runwareAuth,
	name: 'runware_get_task_details',
	displayName: 'Get Task Details',
	description: 'Gets the original request and response of a past task.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the full original request and response of a previously executed Runware task, by its taskUUID, to recover a lost result or debug a failure. Organizations with Zero Data Retention get no stored content. For the live status of an async task use Get Task Result.',
		idempotent: true,
	},
	props: {
		taskUUID: runwareAiProps.taskUUID({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await runwareApi.runTask({
			auth,
			task: { taskType: 'getTaskDetails', taskUUID: propsValue.taskUUID },
		});
	},
});
