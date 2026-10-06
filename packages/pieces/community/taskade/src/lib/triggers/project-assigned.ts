import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeWebhook } from '../common/webhook';
import { taskadeOutputSchemas } from '../output-schemas';

export const projectAssignedTrigger = createTrigger({
	auth: taskadeAuth,
	name: 'project_assigned',
	displayName: 'Project Assigned',
	description: 'Fires when a project is assigned to someone. Needs a Taskade Pro plan or above.',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fires when a Taskade project is assigned to someone, with the project, its workspace, who assigned it and the assignee. Deliveries are signature-checked and repeats are dropped. Needs a Taskade Pro plan.',
	},
	outputSchema: taskadeOutputSchemas['projectAssignedTrigger'],
	sampleData: {
		spaceName: 'Acme Workspace',
		spaceId: '1UsRFaZu9XgyTFej',
		projectName: 'Q3 Launch Plan',
		projectId: 'A1b2C3d4E5f6G7h8',
		assignerName: 'Jane Doe',
		assigneeName: 'John Smith',
		assigneeId: 12345,
	},
	props: taskadeWebhook.webhookTriggerProps,
	type: TriggerStrategy.WEBHOOK,
	...taskadeWebhook.webhookTriggerHooks('project.assigned'),
});
