import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeWebhook } from '../common/webhook';
import { taskadeOutputSchemas } from '../output-schemas';

export const projectJoinedTrigger = createTrigger({
	auth: taskadeAuth,
	name: 'project_joined',
	displayName: 'Member Joined Project',
	description: 'Fires when someone joins a project. Needs a Taskade Pro plan or above.',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fires when someone joins a Taskade project, with the project, its workspace and the new member\'s name and user ID. Deliveries are signature-checked. Taskade sends no delivery ID, so a delivery Taskade resends can run the flow again. Needs a Taskade Pro plan.',
	},
	outputSchema: taskadeOutputSchemas['projectJoinedTrigger'],
	sampleData: {
		spaceId: '1UsRFaZu9XgyTFej',
		projectName: 'Q3 Launch Plan',
		projectId: 'A1b2C3d4E5f6G7h8',
		joinerName: 'John Smith',
		joinerUserId: 12345,
	},
	props: taskadeWebhook.webhookTriggerProps,
	type: TriggerStrategy.WEBHOOK,
	...taskadeWebhook.webhookTriggerHooks('project.joined'),
});
