import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdayWqlRequest } from '../common';

const polling: Polling<AppConnectionValueForAuthProperty<typeof workdayAuth>, Record<string, never>> = {
	strategy: DedupeStrategy.LAST_ITEM,
	items: async ({ auth }) => {
		const response = await workdayWqlRequest<{ total: number; data: Array<Record<string, unknown>> }>(
			auth,
			`SELECT worker, fullName FROM allActiveEmployees LIMIT 100`,
		);

		const items = response.body.data ?? [];
		return items.map((item) => ({
			id: JSON.stringify(item),
			data: item,
		}));
	},
};

export const businessProcessCompleted = createTrigger({
	auth: workdayAuth,
	name: 'business_process_completed',
	displayName: 'Business Process Event Completed',
	description: 'Triggers when a business process event is completed in Workday.',
	props: {},
	sampleData: { id: 'bp-001', descriptor: 'Hire: John Smith', completedDate: '2026-04-01T14:30:00Z' },
	type: TriggerStrategy.POLLING,
	async test(ctx) { return await pollingHelper.test(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files }); },
	async onEnable(ctx) { await pollingHelper.onEnable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue }); },
	async onDisable(ctx) { await pollingHelper.onDisable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue }); },
	async run(ctx) { return await pollingHelper.poll(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files }); },
});
