import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeWebhook } from '../common/webhook';
import { taskadeOutputSchemas } from '../output-schemas';

export const taskDueTrigger = createTrigger({
	auth: taskadeAuth,
	name: 'task_due',
	displayName: 'Task Due',
	description: 'Fires when a task\'s due date arrives. Needs a Taskade Pro plan or above.',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fires when the due date of a Taskade task arrives, with the task ID and text, its project and workspace, assignees and start/end date. Deliveries are signature-checked. Taskade sends no delivery ID, so a delivery Taskade resends can run the flow again. Needs a Taskade Pro plan.',
	},
	outputSchema: taskadeOutputSchemas['taskDueTrigger'],
	sampleData: {
		spaceName: 'Acme Workspace',
		spaceID: '1UsRFaZu9XgyTFej',
		projectName: 'Q3 Launch Plan',
		projectID: 'A1b2C3d4E5f6G7h8',
		id: '099630d4-267e-4b22-894b-08b69f3a4d79',
		text: 'Send the launch email',
		isCompleted: false,
		assignees: ['janedoe'],
		taskStartDate: null,
		taskStartTime: null,
		taskStartTimezone: null,
		taskEndDate: '2026-06-16',
		taskEndTime: '09:00',
		taskEndTimezone: 'Europe/Berlin',
	},
	props: taskadeWebhook.webhookTriggerProps,
	type: TriggerStrategy.WEBHOOK,
	...taskadeWebhook.webhookTriggerHooks('task.due'),
});
