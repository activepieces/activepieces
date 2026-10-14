import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { workdayAuth } from '../auth';
import { workdayBusinessProcessTransactions } from '../common';
import { readNestedDescriptor, readNestedId } from '../common/fields';

const polling: Polling<AppConnectionValueForAuthProperty<typeof workdayAuth>, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS }) => {
		const rows = await workdayBusinessProcessTransactions({
			auth,
			momentField: 'dateAndTimeCompleted',
			sinceEpochMS: lastFetchEpochMS,
			completedOnly: true,
		});
		return rows.map((row) => ({
			epochMilliSeconds: dayjs(String(row['dateAndTimeCompleted'])).valueOf(),
			data: {
				id: readNestedId(row['businessProcessEvent']),
				descriptor: readNestedDescriptor(row['businessProcessEvent']),
				completedDate: row['dateAndTimeCompleted'],
				...row,
			},
		}));
	},
};

export const businessProcessCompleted = createTrigger({
	auth: workdayAuth,
	name: 'business_process_completed',
	classification: 'READ',
	displayName: 'Business Process Event Completed',
	description: 'Triggers when a business process event is completed in Workday.',
	aiMetadata: {
		description:
			'Fires when a Workday business process completes (e.g. a hire, change-job, or approval workflow reaches its end state), detected by polling business process transactions with status Successfully Completed by their completion time. Use to run downstream automation once a Workday workflow finishes.',
	},
	props: {},
	sampleData: { id: 'bp-001', descriptor: 'Hire: John Smith', completedDate: '2026-04-01T14:30:00Z' },
	type: TriggerStrategy.POLLING,
	async test(ctx) { return await pollingHelper.test(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files }); },
	async onEnable(ctx) { await pollingHelper.onEnable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue }); },
	async onDisable(ctx) { await pollingHelper.onDisable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue }); },
	async run(ctx) { return await pollingHelper.poll(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files }); },
});
