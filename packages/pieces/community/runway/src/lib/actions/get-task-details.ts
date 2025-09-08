import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { runwayAuth, runwayRequest } from '../common';

type TaskResponse = {
	id: string;
	status: string;
	created_at: string;
	updated_at?: string;
	outputs?: Array<{ url: string; type?: string }>;
	failure_code?: string;
	failure_message?: string;
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
			versionHeader: '2024-06-01',
		});
		let outputs = task.outputs || [];
		let artifacts: Array<any> = [];
		if (propsValue.downloadOutput && outputs.length > 0) {
			for (const [index, o] of outputs.entries()) {
				const res = await httpClient.sendRequest<ArrayBuffer>({
					method: HttpMethod.GET,
					url: o.url,
					responseType: 'arraybuffer',
					authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
					timeout: 120000,
				});
				const extension = (o.type && o.type.includes('video')) ? 'mp4' : (o.type && o.type.includes('png') ? 'png' : 'jpg');
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
			createdAt: task.created_at,
			updatedAt: task.updated_at,
			outputs,
			artifacts,
			failureCode: task.failure_code,
			failureMessage: task.failure_message,
		};
	},
});


