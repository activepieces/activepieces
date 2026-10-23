import { createAction } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareAiProps } from '../../common/ai-props';
import { runwareApi } from '../../common/api';

export const getTaskResultAction = createAction({
	auth: runwareAuth,
	name: 'runware_get_task_result',
	displayName: 'Get Task Result',
	description: 'Gets the status and outputs of an asynchronous task.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads the current status (processing, success or error) and any finished outputs of an asynchronous Runware task, such as one started by Generate Video or Generate 3D Model, or an async-only upscale, background removal or text model. Call it again later while the status is processing; it does not wait.',
		idempotent: true,
	},
	props: {
		taskUUID: runwareAiProps.taskUUID({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await runwareApi.runTask({
			auth,
			task: { taskType: 'getResponse', taskUUID: propsValue.taskUUID },
		});
	},
});
