import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { clockifyAuth } from '../../index';
import { clockifyApiCall } from '../common/client';
import { projectId, workspaceId } from '../common/props';

const TRIGGER_KEY = 'new-task-trigger';

export const newTaskTrigger = createTrigger({
	auth: clockifyAuth,
	name: 'new-task',
	displayName: 'New Task',
	description: 'Triggers when a new task is created in specified project.',
	type: TriggerStrategy.WEBHOOK,
	props: {
		workspaceId: workspaceId({
			displayName: 'Workspace',
			required: true,
		}),
		projectId: projectId({
			displayName: 'Project',
			required: true,
		}),
	},
	async onEnable(context) {
		const { workspaceId, projectId } = context.propsValue;

		const response = await clockifyApiCall<{ id: string }>({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/workspaces/${workspaceId}/webhooks`,
			body: {
				url: context.webhookUrl,
				webhookEvent: 'NEW_TASK',
				triggerSourceType: 'PROJECT_ID',
				triggerSource: [projectId],
			},
		});

		await context.store.put<string>(TRIGGER_KEY, response.id);
	},
	async onDisable(context) {
		const { workspaceId } = context.propsValue;

		const webhookId = await context.store.get<string>(TRIGGER_KEY);

		if (!isNil(webhookId)) {
			await clockifyApiCall({
				apiKey: context.auth,
				method: HttpMethod.DELETE,
				resourceUri: `/workspaces/${workspaceId}/webhooks/${webhookId}`,
			});
		}
	},
	async test(context) {
		const { workspaceId, projectId } = context.propsValue;

		const response = await clockifyApiCall<{ id: string }[]>({
			apiKey: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
			query: {
				page: '1',
				'page-size': 5,
			},
		});

		return response;
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
