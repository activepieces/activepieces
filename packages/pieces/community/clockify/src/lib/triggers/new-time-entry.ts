import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { clockifyAuth } from '../../index';
import { clockifyApiCall } from '../common/client';
import { projectId, taskId, workspaceId } from '../common/props';

const TRIGGER_KEY = 'new-time-entry-trigger';

export const newTimeEntryTrigger = createTrigger({
	auth: clockifyAuth,
	name: 'new-time-entry',
	displayName: 'New Time Entry',
	description: 'Triggers when a new time entry is created.',
	type: TriggerStrategy.WEBHOOK,
	props: {
		workspaceId: workspaceId({
			displayName: 'Workspace',
			required: true,
		}),
		projectId: projectId({
			displayName: 'Project',
			required: false,
		}),
		taskId: taskId({
			displayName: 'Task',
			required: false,
		}),
	},
	async onEnable(context) {
		const { workspaceId, projectId, taskId } = context.propsValue;

		const payload: Record<string, any> = {
			url: context.webhookUrl,
			webhookEvent: 'NEW_TIME_ENTRY',
		};

		if (workspaceId) {
			payload['triggerSourceType'] = 'WORKSPACE_ID';
			payload['triggerSource'] = [workspaceId];
		}

		if (projectId) {
			payload['triggerSourceType'] = 'PROJECT_ID';
			payload['triggerSource'] = [projectId];
		}

		if (taskId) {
			payload['triggerSourceType'] = 'TASK_ID';
			payload['triggerSource'] = [taskId];
		}

		const response = await clockifyApiCall<{ id: string }>({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/workspaces/${workspaceId}/webhooks`,
			body: payload,
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
		const { workspaceId, projectId, taskId } = context.propsValue;
		const currentUserResponse = await clockifyApiCall<{ id: string; email: string }>({
			apiKey: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/user`,
		});

		const userId = currentUserResponse.id;

		const qs: QueryParams = { hydrated: 'true', page: '1', 'page-size': '5' };

		if (projectId) qs['project'] = projectId;
		if (taskId) qs['task'] = taskId;

		const response = await clockifyApiCall<{id:string}[]>({
			apiKey: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/workspaces/${workspaceId}/user/${userId}/time-entries`,
			query: qs,
		});

		return response;
	},
	async run(context) {
		return [context.payload.body];
	},
	sampleData: {
		id: '68453d0cf0c88d522704ab76',
		description: 'Test',
		userId: '684446430300f917a02c198a',
		billable: true,
		projectId: '68444b15551a9934b5034263',
		timeInterval: {
			start: '2025-06-16T07:05:00Z',
			end: '2025-06-16T18:53:00Z',
			duration: 'PT11H48M',
			timeZone: 'Asia/Calcutta',
			offsetStart: 19800,
			offsetEnd: 19800,
			zonedStart: '2025-06-16T12:35:00',
			zonedEnd: '2025-06-17T00:23:00',
		},
		workspaceId: '684446430300f917a02c198b',
		isLocked: false,
		hourlyRate: null,
		costRate: null,
		customFieldValues: [],
		type: 'REGULAR',
		kioskId: null,
		approvalStatus: null,
		projectCurrency: null,
		currentlyRunning: false,
		project: {
			name: 'Test',
			clientId: '',
			workspaceId: '684446430300f917a02c198b',
			billable: true,
			estimate: {
				estimate: 'PT0S',
				type: 'AUTO',
			},
			color: '#039BE5',
			archived: false,
			clientName: '',
			duration: 'PT47H12M45S',
			note: '',
			activeEstimate: 'NONE',
			timeEstimate: {
				includeNonBillable: true,
				estimate: 0,
				type: 'AUTO',
				resetOption: null,
			},
			budgetEstimate: null,
			id: '68444b15551a9934b5034263',
			public: true,
			template: false,
		},
		task: {
			name: 'test',
			projectId: '68444b15551a9934b5034263',
			assigneeId: '684446430300f917a02c198a',
			assigneeIds: ['684446430300f917a02c198a'],
			userGroupIds: [],
			estimate: 'PT0S',
			status: 'ACTIVE',
			workspaceId: '684446430300f917a02c198b',
			budgetEstimate: 0,
			billable: true,
			hourlyRate: null,
			costRate: null,
			auditMetadata: {
				updatedAt: 1749306307000,
			},
			id: '68444badb7688b61f151284d',
			duration: 'PT35H24M41S',
		},
		user: {
			id: '684446430300f917a02c198a',
			name: 'johndoe',
			status: 'ACTIVE',
		},
		tags: [
			{
				name: 'new',
				workspaceId: '684446430300f917a02c198b',
				archived: false,
				id: '68452a1b0300f917a02f30bc',
			},
		],
	},
});
