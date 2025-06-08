import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { clockifyAuth } from '../../index';
import { BASE_URL } from '../common';

const TRIGGER_KEY = 'new-task-trigger';

export const newTaskTrigger = createTrigger({
	auth: clockifyAuth,
	name: 'new-task',
	displayName: 'New Task',
	description: 'Triggers when a new task is created in specified project.',
	type: TriggerStrategy.WEBHOOK,
	props: {
		workspaceId: Property.Dropdown({
			displayName: 'Workspace',
			refreshers: [],
			required: true,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account first.',
					};
				}

				const response = await httpClient.sendRequest<{ id: string; name: string }[]>({
					method: HttpMethod.GET,
					url: BASE_URL + '/workspaces',
					headers: {
						'X-Api-Key': auth as string,
					},
				});

				return {
					disabled: false,
					options: response.body.map((workspace) => ({
						label: workspace.name,
						value: workspace.id,
					})),
				};
			},
		}),
		projectId: Property.Dropdown({
			displayName: 'Project',
			refreshers: ['workspaceId'],
			required: true,
			options: async ({ auth, workspaceId }) => {
				if (!auth || !workspaceId) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account first.',
					};
				}

				const response = await httpClient.sendRequest<{ id: string; name: string }[]>({
					method: HttpMethod.GET,
					url: BASE_URL + `/workspaces/${workspaceId}/projects`,
					headers: {
						'X-Api-Key': auth as string,
					},
				});

				return {
					disabled: false,
					options: response.body.map((project) => ({
						label: project.name,
						value: project.id,
					})),
				};
			},
		}),
	},
	async onEnable(context) {
		const { workspaceId, projectId } = context.propsValue;

		const response = await httpClient.sendRequest<{ id: string }>({
			method: HttpMethod.POST,
			url: BASE_URL + `/workspaces/${workspaceId}/webhooks`,
			headers: {
				'X-Api-Key': context.auth as string,
			},
			body: {
				url: context.webhookUrl,
				webhookEvent: 'NEW_TASK',
				triggerSourceType: 'PROJECT_ID',
				triggerSource: [projectId],
			},
		});

		await context.store.put<string>(TRIGGER_KEY, response.body.id);
	},
	async onDisable(context) {
		const { workspaceId } = context.propsValue;

		const webhookId = await context.store.get<string>(TRIGGER_KEY);

		if (!isNil(webhookId)) {
			await httpClient.sendRequest<{ id: string }>({
				method: HttpMethod.DELETE,
				url: BASE_URL + `/workspaces/${workspaceId}/webhooks/${webhookId}`,
				headers: {
					'X-Api-Key': context.auth as string,
				},
			});
		}
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
