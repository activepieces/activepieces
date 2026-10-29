import dayjs from 'dayjs';

import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';
import { workdayUtils } from '../common/utils';

const polling: Polling<
	AppConnectionValueForAuthProperty<typeof workdayAuth>,
	Record<string, never>
> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS }) => {
		const rows = await workdayApi.listBusinessProcessTransactions({
			auth,
			momentField: 'dateAndTimeInitiated',
			sinceEpochMS: lastFetchEpochMS,
			typeIds: [EXPENSE_REPORT_EVENT_TYPE_ID],
		});
		return rows.map((row) => ({
			epochMilliSeconds: dayjs(String(row['dateAndTimeInitiated'])).valueOf(),
			data: {
				id: workdayUtils.readNestedId({ value: row['businessProcessEvent'] }),
				descriptor: workdayUtils.readNestedDescriptor({ value: row['businessProcessEvent'] }),
				createdDate: row['dateAndTimeInitiated'],
				...row,
			},
		}));
	},
};

export const expenseReportSubmittedTrigger = createTrigger({
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
	sampleData: {
		id: 'exp-001',
		descriptor: 'Q1 Travel Expenses',
		createdDate: '2026-04-01T09:00:00Z',
	},
	type: TriggerStrategy.POLLING,
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
});

const EXPENSE_REPORT_EVENT_TYPE_ID = '77705ce8252a4a089feff77ee9c8417e';
