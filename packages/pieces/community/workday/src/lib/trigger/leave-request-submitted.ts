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
			typeIds: [REQUEST_TIME_OFF_TYPE_ID, REQUEST_LEAVE_OF_ABSENCE_TYPE_ID],
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

export const leaveRequestSubmitted = createTrigger({
	auth: workdayAuth,
	name: 'leave_request_submitted',
	classification: 'READ',
	displayName: 'Leave Request Submitted',
	description: 'Triggers when a leave request is submitted in Workday.',
	aiMetadata: {
		description:
			'Fires when a time-off or leave-of-absence request is submitted in Workday, detected by polling Request Time Off and Request Leave of Absence business process transactions by their initiation time. Use to start leave approval or coverage-planning automation.',
	},
	props: {},
	sampleData: { id: 'lr-001', descriptor: 'Vacation Request - John Smith', createdDate: '2026-04-01T11:00:00Z' },
	type: TriggerStrategy.POLLING,
	async test(ctx) { return await pollingHelper.test(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files }); },
	async onEnable(ctx) { await pollingHelper.onEnable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue }); },
	async onDisable(ctx) { await pollingHelper.onDisable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue }); },
	async run(ctx) { return await pollingHelper.poll(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files }); },
});

const REQUEST_TIME_OFF_TYPE_ID = '6e3795247ebf4915bbb22924af08119f';
const REQUEST_LEAVE_OF_ABSENCE_TYPE_ID = '1d07c509cca34688b3fb9c0c3dba4789';
