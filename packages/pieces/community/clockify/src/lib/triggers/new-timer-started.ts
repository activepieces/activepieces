import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../auth';
import { clockifyApi } from '../common/api';
import { clockifyProps } from '../common/props';
import { webhookTimeEntryOutputSchema } from '../output-schemas';

const TRIGGER_KEY = 'new-timer-started-trigger';

export const newTimerStartedTrigger = createTrigger({
	auth: clockifyAuth,
	name: 'new-timer-started',
	outputSchema: webhookTimeEntryOutputSchema,
	classification: 'READ',
	displayName: 'New Timer Started',
	description: 'Triggers when a new entry is started and running.',
	aiMetadata: {
		description:
			'Fires when a timer is started and begins running on the specified workspace, emitting the newly started time entry. Use to react to live timers as they begin.',
	},
	type: TriggerStrategy.WEBHOOK,
	props: {
		workspaceId: clockifyProps.workspaceId({ required: true }),
	},
	async onEnable(context) {
		const { workspaceId } = context.propsValue;

		const response = await clockifyApi.createWebhook({
			auth: context.auth,
			workspaceId,
			url: context.webhookUrl,
			webhookEvent: 'NEW_TIMER_STARTED',
			triggerSourceType: 'WORKSPACE_ID',
			triggerSource: [workspaceId],
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
