import { createAction, Property } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { runwayAuth } from '../common';
import RunwayML from '@runwayml/sdk';
import { z } from 'zod';

export const cancelOrDeleteTask = createAction({
	auth: runwayAuth,
	name: 'cancel_or_delete_task',
	displayName: 'Cancel or Delete Task',
	description: 'Cancel or delete a task. Running/pending tasks are cancelled, completed tasks are deleted.',
	props: {
		taskId: Property.ShortText({
			displayName: 'Task ID',
			description: 'The ID of the task to cancel or delete (UUID format)',
			required: true
		}),
	},
	async run({ auth, propsValue }) {
		await propsValidation.validateZod(propsValue, {
			taskId: z.string().uuid('Task ID must be a valid UUID format'),
		});

		const apiKey = auth as string;
		const client = new RunwayML({ apiKey });

		// First get task details to determine what action will be taken
		let task;
		try {
			task = await client.tasks.retrieve(propsValue.taskId);
		} catch (error: any) {
			if (error.status === 404) {
				throw new Error(`Task not found: ${propsValue.taskId}. The task may have already been deleted.`);
			}
			throw new Error(`Failed to retrieve task: ${error.message || 'Unknown error'}`);
		}

		const wasRunning = ['RUNNING', 'PENDING', 'THROTTLED'].includes(task.status);
		const action = wasRunning ? 'cancelled' : 'deleted';

		try {
			await client.tasks.delete(propsValue.taskId);
			
			return {
				success: true,
				taskId: task.id,
				action: action,
				message: `Task ${action} successfully`,
				previousStatus: task.status,
				wasRunning: wasRunning
			};
		} catch (error: any) {
			if (error.status === 404) {
				return {
					success: true,
					taskId: propsValue.taskId,
					action: 'already_deleted',
					message: 'Task was already deleted',
					previousStatus: 'UNKNOWN',
					wasRunning: false
				};
			}
			throw new Error(`Failed to ${action.slice(0, -1)} task: ${error.message || 'Unknown error'}`);
		}
	},
});


