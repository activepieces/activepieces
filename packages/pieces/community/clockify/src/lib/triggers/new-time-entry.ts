import { QueryParams } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../auth';
import { clockifyApi } from '../common/api';
import { clockifyProps } from '../common/props';
import { webhookTimeEntryOutputSchema } from '../output-schemas';

const TRIGGER_KEY = 'new-time-entry-trigger';

export const newTimeEntryTrigger = createTrigger({
	auth: clockifyAuth,
	name: 'new-time-entry',
	outputSchema: webhookTimeEntryOutputSchema,
	classification: 'READ',
	displayName: 'New Time Entry',
	description: 'Triggers when a new time entry is created.',
	aiMetadata: {
		description:
			'Fires when a new time entry is created, emitting the entry. Scope is narrowed by the optional project and task: with neither set it watches the whole workspace, with a project it watches that project, and with a task it watches that task.',
	},
	type: TriggerStrategy.WEBHOOK,
	props: {
		workspaceId: clockifyProps.workspaceId({ required: true }),
		projectId: clockifyProps.projectId({ required: false }),
		taskId: clockifyProps.taskId({ required: false }),
	},
	async onEnable(context) {
		const { workspaceId, projectId, taskId } = context.propsValue;

		let triggerSourceType: string | undefined;
		let triggerSource: string[] | undefined;

		if (workspaceId) {
			triggerSourceType = 'WORKSPACE_ID';
			triggerSource = [workspaceId];
		}

		if (projectId) {
			triggerSourceType = 'PROJECT_ID';
			triggerSource = [projectId];
		}

		if (taskId) {
			triggerSourceType = 'TASK_ID';
			triggerSource = [taskId];
		}

		const response = await clockifyApi.createWebhook({
			auth: context.auth,
			workspaceId,
			url: context.webhookUrl,
			webhookEvent: 'NEW_TIME_ENTRY',
			triggerSourceType,
			triggerSource,
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
		const { workspaceId, projectId, taskId } = context.propsValue;
		const currentUser = await clockifyApi.getCurrentUser({ auth: context.auth });

		const qs: QueryParams = { hydrated: 'true', page: '1', 'page-size': '5' };

		if (projectId) qs['project'] = projectId;
		if (taskId) qs['task'] = taskId;

		return await clockifyApi.listUserTimeEntries({
			auth: context.auth,
			workspaceId,
			userId: currentUser.id,
			query: qs,
		});
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
