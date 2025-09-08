import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { runwayAuth, runwayRequest, runwayTaskIdProperty } from '../common';

export const cancelOrDeleteTask = createAction({
	auth: runwayAuth,
	name: 'cancel_or_delete_task',
	displayName: 'Cancel or Delete Task',
	description: 'Cancel a running task or delete a finished one',
	props: {
		taskId: runwayTaskIdProperty,
	},
	async run({ auth, propsValue }) {
		const apiKey = auth as string;
		const taskId = propsValue.taskId as string;
		try {
			await runwayRequest<void>({
				apiKey,
				method: HttpMethod.DELETE,
				resource: `/v1/tasks/${encodeURIComponent(taskId)}`,
			});
			return { id: taskId, success: true };
		} catch (e: any) {
			const status = e?.response?.status as number | undefined;
			if (status === 404) {
				return { id: taskId, success: true };
			}
			throw e;
		}
	},
});


