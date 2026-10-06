import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeWebhook } from '../common/webhook';
import { taskadeOutputSchemas } from '../output-schemas';

export const commentCreatedTrigger = createTrigger({
	auth: taskadeAuth,
	name: 'comment_created',
	displayName: 'New Comment',
	description: 'Fires when a comment is added to a task. Needs a Taskade Pro plan or above.',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fires when someone comments on a Taskade task, with the comment text, the commenter, the task ID and text, and the project. Deliveries are signature-checked and repeats are dropped. Needs a Taskade Pro plan.',
	},
	outputSchema: taskadeOutputSchemas['commentCreatedTrigger'],
	sampleData: {
		projectName: 'Customer Projects',
		projectId: 'A1b2C3d4E5f6G7h8',
		nodeId: '099630d4-267e-4b22-894b-08b69f3a4d79',
		nodeText: 'Follow up with the client',
		commenterDisplayName: 'Jane Doe',
		commenterHandle: 'janedoe',
		commentBody: 'Done, sent the proposal.',
		commentBodyType: 'text/markdown',
		assignees: [],
		mentionedHandles: [],
	},
	props: taskadeWebhook.webhookTriggerProps,
	type: TriggerStrategy.WEBHOOK,
	...taskadeWebhook.webhookTriggerHooks('comment.created'),
});
