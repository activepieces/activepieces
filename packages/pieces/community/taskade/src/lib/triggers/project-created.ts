import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeWebhook } from '../common/webhook';
import { taskadeOutputSchemas } from '../output-schemas';

export const projectCreatedTrigger = createTrigger({
	auth: taskadeAuth,
	name: 'project_created',
	displayName: 'New Project',
	description: 'Fires when a project is created. Needs a Taskade Pro plan or above.',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fires when a Taskade project is created, with the project ID and name, its workspace and who created it. Deliveries are signature-checked. Taskade sends no delivery ID, so a delivery Taskade resends can run the flow again. Needs a Taskade Pro plan.',
	},
	outputSchema: taskadeOutputSchemas['projectCreatedTrigger'],
	sampleData: {
		spaceName: 'Acme Workspace',
		spaceId: '1UsRFaZu9XgyTFej',
		projectName: 'Q3 Launch Plan',
		projectId: 'A1b2C3d4E5f6G7h8',
		creatorName: 'Jane Doe',
	},
	props: taskadeWebhook.webhookTriggerProps,
	type: TriggerStrategy.WEBHOOK,
	...taskadeWebhook.webhookTriggerHooks('project.created'),
});
