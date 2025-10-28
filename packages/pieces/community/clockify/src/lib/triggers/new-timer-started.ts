import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { clockifyAuth } from '../../index';
import { clockifyApiCall } from '../common/client';
import { workspaceId } from '../common/props';

const TRIGGER_KEY = 'new-timer-started-trigger';

export const newTimerStartedTrigger = createTrigger({
	auth: clockifyAuth,
	name: 'new-timer-started',
	displayName: 'New Timer Started',
	description: 'Triggers when a new entry is started and running.',
	type: TriggerStrategy.WEBHOOK,
	props: {
		workspaceId: workspaceId({
			displayName: 'Workspace',
			required: true,
		}),
	},
	async onEnable(context) {
		const { workspaceId } = context.propsValue;

		const response = await clockifyApiCall<{ id: string }>({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/workspaces/${workspaceId}/webhooks`,
			body: {
				url: context.webhookUrl,
				webhookEvent: 'NEW_TIMER_STARTED',
				triggerSourceType: 'WORKSPACE_ID',
				triggerSource: [workspaceId],
			},
		});

		await context.store.put<string>(TRIGGER_KEY, response.id);
	},
	async onDisable(context) {
		const { workspaceId } = context.propsValue;

		const webhookId = await context.store.get<string>(TRIGGER_KEY);

		if (!isNil(webhookId)) {
			await clockifyApiCall<{ id: string }>({
				apiKey: context.auth,
				method: HttpMethod.DELETE,
				resourceUri: `/workspaces/${workspaceId}/webhooks/${webhookId}`,
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
