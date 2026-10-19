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
			momentField: 'dateAndTimeCompleted',
			sinceEpochMS: lastFetchEpochMS,
			completedOnly: true,
		});
		return rows.map((row) => ({
			epochMilliSeconds: dayjs(String(row['dateAndTimeCompleted'])).valueOf(),
			data: {
				id: workdayUtils.readNestedId({ value: row['businessProcessEvent'] }),
				descriptor: workdayUtils.readNestedDescriptor({ value: row['businessProcessEvent'] }),
				completedDate: row['dateAndTimeCompleted'],
				...row,
			},
		}));
	},
};

export const businessProcessCompletedTrigger = createTrigger({
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
	sampleData: {
		id: 'bp-001',
		descriptor: 'Hire: John Smith',
		completedDate: '2026-04-01T14:30:00Z',
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
