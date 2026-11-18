import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../auth';
import { clockifyApi } from '../common/api';
import { clockifyProps } from '../common/props';
import { newTaskOutputSchema } from '../output-schemas';

const TRIGGER_KEY = 'new-task-trigger';

export const newTaskTrigger = createTrigger({
	auth: clockifyAuth,
	name: 'new-task',
	outputSchema: newTaskOutputSchema,
	classification: 'READ',
	displayName: 'New Task',
	description: 'Triggers when a new task is created in specified project.',
	aiMetadata: {
		description:
			'Fires when a new task is created in the specified Clockify project, emitting the created task. Scoped to one workspace and project.',
	},
	type: TriggerStrategy.WEBHOOK,
	props: {
		workspaceId: clockifyProps.workspaceId({ required: true }),
		projectId: clockifyProps.projectId({ required: true }),
	},
	async onEnable(context) {
		const { workspaceId, projectId } = context.propsValue;

		const response = await clockifyApi.createWebhook({
			auth: context.auth,
			workspaceId,
			url: context.webhookUrl,
			webhookEvent: 'NEW_TASK',
			triggerSourceType: 'PROJECT_ID',
			triggerSource: [projectId],
		});

		await context.store.put<string>(TRIGGER_KEY, response.id);
	},
	async onDisable(context) {
		const { workspaceId } = context.propsValue;

		const webhookId = await context.store.get<string>(TRIGGER_KEY);

		if (!isNil(webhookId)) {
			await clockifyApi.deleteWebhook({ auth: context.auth, workspaceId, webhookId });
		}
	},
	async test(context) {
		const { workspaceId, projectId } = context.propsValue;

		return await clockifyApi.listTasks({
			auth: context.auth,
			workspaceId,
			projectId,
			query: {
				page: '1',
				'page-size': '5',
			},
		});
	},
	async run(context) {
		return [context.payload.body];
	},
	sampleData: {
		id: '684538940300f917a02f642f',
		name: 'Test',
		projectId: '68444b15551a9934b5034263',
		workspaceId: '684446430300f917a02c198b',
		assigneeIds: [],
		assigneeId: '',
		userGroupIds: [],
		estimate: 'PT0S',
		status: 'ACTIVE',
		budgetEstimate: 0,
		billable: true,
		hourlyRate: null,
		costRate: null,
		progress: null,
		duration: 'PT0S',
	},
});
