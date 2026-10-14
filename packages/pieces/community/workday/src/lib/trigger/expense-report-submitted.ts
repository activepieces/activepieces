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
			momentField: 'dateAndTimeInitiated',
			sinceEpochMS: lastFetchEpochMS,
			typeIds: [EXPENSE_REPORT_EVENT_TYPE_ID],
		});
		return rows.map((row) => ({
			epochMilliSeconds: dayjs(String(row['dateAndTimeInitiated'])).valueOf(),
			data: {
				id: readNestedId(row['businessProcessEvent']),
				descriptor: readNestedDescriptor(row['businessProcessEvent']),
				createdDate: row['dateAndTimeInitiated'],
				...row,
			},
		}));
	},
};

export const expenseReportSubmitted = createTrigger({
	auth: workdayAuth,
	name: 'expense_report_submitted',
	classification: 'READ',
	displayName: 'Expense Report Submitted',
	description: 'Triggers when an expense report is submitted in Workday.',
	aiMetadata: {
		description:
			'Fires when an expense report is submitted in Workday, detected by polling Expense Report Event business process transactions by their initiation time. Represents an expense submission event. Use to start expense review or reimbursement automation.',
	},
	props: {},
	sampleData: { id: 'exp-001', descriptor: 'Q1 Travel Expenses', createdDate: '2026-04-01T09:00:00Z' },
	type: TriggerStrategy.POLLING,
	async test(ctx) { return await pollingHelper.test(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files }); },
	async onEnable(ctx) { await pollingHelper.onEnable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue }); },
	async onDisable(ctx) { await pollingHelper.onDisable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue }); },
	async run(ctx) { return await pollingHelper.poll(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files }); },
});

const EXPENSE_REPORT_EVENT_TYPE_ID = '77705ce8252a4a089feff77ee9c8417e';
