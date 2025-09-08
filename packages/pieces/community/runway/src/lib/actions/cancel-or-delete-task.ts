import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { runwayAuth, runwayRequest, runwayTaskIdProperty } from '../common';

type TaskStatusResponse = { id: string; status: string };

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
		const status = await runwayRequest<TaskStatusResponse>({
			apiKey,
			method: HttpMethod.GET,
			resource: `/v1/tasks/${encodeURIComponent(taskId)}`,
			versionHeader: '2024-06-01',
		});
		if (['pending', 'running', 'throttled'].includes(status.status)) {
			const r = await runwayRequest<TaskStatusResponse>({
				apiKey,
				method: HttpMethod.POST,
				resource: `/v1/tasks/${encodeURIComponent(taskId)}/cancel`,
				versionHeader: '2024-06-01',
			});
			return { id: r.id, status: r.status };
		}
		const r = await runwayRequest<TaskStatusResponse>({
			apiKey,
			method: HttpMethod.DELETE,
			resource: `/v1/tasks/${encodeURIComponent(taskId)}`,
			versionHeader: '2024-06-01',
		});
		return { id: r.id, status: r.status };
	},
});


