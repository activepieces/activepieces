import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdayWqlRequest } from '../common';

const polling: Polling<AppConnectionValueForAuthProperty<typeof workdayAuth>, Record<string, never>> = {
	strategy: DedupeStrategy.LAST_ITEM,
	items: async ({ auth }) => {
		const response = await workdayWqlRequest<{ total: number; data: Array<Record<string, unknown>> }>(
			auth,
			`SELECT timeOffType FROM allTimeOffs LIMIT 100`,
		);

		const items = response.body.data ?? [];
		return items.map((item) => ({
			id: JSON.stringify(item),
			data: item,
		}));
	},
};

export const leaveRequestSubmitted = createTrigger({
	auth: workdayAuth,
	name: 'leave_request_submitted',
	displayName: 'Leave Request Submitted',
	description: 'Triggers when a leave request is submitted in Workday.',
	props: {},
	sampleData: { id: 'lr-001', descriptor: 'Vacation Request - John Smith', createdDate: '2026-04-01T11:00:00Z' },
	type: TriggerStrategy.POLLING,
	async test(ctx) { return await pollingHelper.test(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files }); },
	async onEnable(ctx) { await pollingHelper.onEnable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue }); },
	async onDisable(ctx) { await pollingHelper.onDisable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue }); },
	async run(ctx) { return await pollingHelper.poll(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files }); },
});
