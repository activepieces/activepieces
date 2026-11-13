import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickBatchSaveTasksOutputSchema } from '../../output-schemas';

export const batchSaveTasksAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_batch_save_tasks',
	outputSchema: ticktickBatchSaveTasksOutputSchema,
	displayName: 'Batch Create or Update Tasks',
	description: 'Creates and updates many tasks in a single request.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates up to 50 tasks (add) and updates up to 50 tasks (update) in one call. Each add item needs title and projectId; each update item needs id and projectId. Returns id2etag for saved tasks and failed (task id to error code) for rejected ones. Not idempotent because add creates new tasks.',
		idempotent: false,
	},
	props: {
		add: Property.Json({
			displayName: 'Tasks to Create',
			description: 'Array of up to 50 tasks, each like {"title": "New task", "projectId": "..."}.',
			required: false,
		}),
		update: Property.Json({
			displayName: 'Tasks to Update',
			description: 'Array of up to 50 tasks, each like {"id": "...", "projectId": "...", "title": "..."}.',
			required: false,
		}),
	},
	async run(context) {
		const { add, update } = context.propsValue;
		const addList = toTaskList({ value: add, label: 'Tasks to Create' });
		const updateList = toTaskList({ value: update, label: 'Tasks to Update' });
		if (addList.length === 0 && updateList.length === 0) {
			throw new Error('Provide at least one task to create or update.');
		}
		const response = await tickTickApiCall<{
			id2etag?: Record<string, string>;
			id2error?: Record<string, string>;
		}>({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/task/batch',
			body: {
				...(addList.length > 0 ? { add: addList } : {}),
				...(updateList.length > 0 ? { update: updateList } : {}),
			},
		});
		const id2etag = response.id2etag ?? {};
		const failed = Object.entries(response.id2error ?? {}).map(([taskId, error]) => ({
			taskId,
			error,
		}));
		return {
			success: failed.length === 0,
			savedCount: Object.keys(id2etag).length,
			id2etag,
			failed,
		};
	},
});

function toTaskList({ value, label }: { value: unknown; label: string }): unknown[] {
	if (value === undefined || value === null || value === '') {
		return [];
	}
	if (!Array.isArray(value)) {
		throw new Error(`${label} must be an array of tasks.`);
	}
	if (value.length > 50) {
		throw new Error(`${label} supports at most 50 tasks.`);
	}
	return value;
}
