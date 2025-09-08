import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { runwayAuth, runwayRequest } from '../common';

type TaskResponse = {
	id: string;
	status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'PENDING' | 'CANCELLED' | 'THROTTLED';
	createdAt: string;
	failure?: string;
	failureCode?: string;
	output?: string[];
	progress?: number;
};

export const getTaskDetails = createAction({
	auth: runwayAuth,
	name: 'get_task_details',
	displayName: 'Get Task Details',
	description: 'Fetch task details by ID',
	props: {
		taskId: Property.ShortText({ displayName: 'Task ID', required: true }),
		downloadOutput: Property.Checkbox({ displayName: 'Download Output', required: false }),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = auth as string;
		const task = await runwayRequest<TaskResponse>({
			apiKey,
			method: HttpMethod.GET,
			resource: `/v1/tasks/${encodeURIComponent(propsValue.taskId as string)}`,
		});
		const outputs = task.output || [];
		let artifacts: Array<any> = [];
		if (propsValue.downloadOutput && outputs.length > 0) {
			for (const [index, url] of outputs.entries()) {
				const res = await httpClient.sendRequest<ArrayBuffer>({
					method: HttpMethod.GET,
					url,
					responseType: 'arraybuffer',
					authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
					timeout: 120000,
				});
				const extension = 'mp4';
				const file = await files.write({
					fileName: `runway-output-${index + 1}.${extension}`,
					data: Buffer.from(res.body as any),
				});
				artifacts.push(file);
			}
		}
		return {
			id: task.id,
			status: task.status,
			createdAt: task.createdAt,
			outputs,
			artifacts,
			failureCode: task.failureCode,
			failureMessage: task.failure,
			progress: task.progress,
		};
	},
});


