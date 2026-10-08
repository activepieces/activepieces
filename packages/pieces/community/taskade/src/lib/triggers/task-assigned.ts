import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeWebhook } from '../common/webhook';
import { taskadeOutputSchemas } from '../output-schemas';

export const taskAssignedTrigger = createTrigger({
	auth: taskadeAuth,
	name: 'task_assigned',
	displayName: 'Task Assigned',
	description: 'Fires when tasks are assigned to someone. Needs a Taskade Pro plan or above.',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fires when one or more Taskade tasks are assigned to someone, with the project, who assigned them and each task\'s ID, text, completion and assignee handles. Deliveries are signature-checked. Taskade sends no delivery ID, so a delivery Taskade resends can run the flow again. Needs a Taskade Pro plan.',
	},
	outputSchema: taskadeOutputSchemas['taskAssignedTrigger'],
	sampleData: {
		projectName: 'Customer Projects',
		projectId: 'A1b2C3d4E5f6G7h8',
		assignerName: 'Jane Doe',
		nodes: [
			{
				nodeId: '099630d4-267e-4b22-894b-08b69f3a4d79',
				nodeText: 'Prepare the quote',
				isCompleted: false,
				assignees: ['johnsmith'],
			},
		],
	},
	props: taskadeWebhook.webhookTriggerProps,
	type: TriggerStrategy.WEBHOOK,
	...taskadeWebhook.webhookTriggerHooks('task.assigned'),
});
