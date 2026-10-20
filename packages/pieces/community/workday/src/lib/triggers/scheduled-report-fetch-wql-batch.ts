import dayjs from 'dayjs';

import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	StaticPropsValue,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';
import { workdayProps } from '../common/props';
import { workdayUtils } from '../common/utils';

const props = {
	query: workdayProps.wqlQuery({ required: true }),
	dateField: workdayProps.dateField({ required: false }),
};

const polling: Polling<
	AppConnectionValueForAuthProperty<typeof workdayAuth>,
	StaticPropsValue<typeof props>
> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const records = await workdayApi.runWqlAll({ auth, query: propsValue.query });
		const dateField = propsValue.dateField ?? 'lastFunctionallyUpdated';
		const isTest = lastFetchEpochMS === 0;

		const filtered = records.filter((item) => {
			if (isTest) {
				return true;
			}
			const dateValue = item[dateField];
			if (typeof dateValue !== 'string') {
				return false;
			}
			return dayjs(dateValue).valueOf() > lastFetchEpochMS;
		});
		const limited = isTest ? filtered.slice(0, 10) : filtered;
		const flattened = limited.map((row) => workdayUtils.flattenRecord({ value: row }));
		if (flattened.length === 0) {
			return [];
		}

		const latest = flattened.reduce((max, row) => {
			const value = row[dateField];
			if (typeof value === 'string') {
				return Math.max(max, dayjs(value).valueOf());
			}
			return max;
		}, lastFetchEpochMS);

		return [
			{
				epochMilliSeconds: latest || Date.now(),
				data: {
					total_count: flattened.length,
					records: flattened,
					fetched_at: dayjs().toISOString(),
				},
			},
		];
	},
};

export const scheduledReportFetchWqlBatchTrigger = createTrigger({
	auth: workdayAuth,
	name: 'scheduled_report_fetch_wql_batch',
	classification: 'READ',
	displayName: 'Scheduled Report Fetch using WQL (Batch)',
	description: 'Polls a WQL query on a schedule and returns matching rows as a batch.',
	aiMetadata: {
		description:
			'Fires on every poll with the rows of a Workday Query Language (WQL) query that are newer than the previous run, delivered as one batch. Recency is judged by a configurable date field, defaulting to lastFunctionallyUpdated, so the query must select that column. Use for scheduled WQL extracts; use Scheduled Report Fetch (Batch) when the data comes from a published report definition instead.',
	},
	props,
	sampleData: {
		total_count: 1,
		records: [{ employee_id: 'worker-001', name: 'Jane Doe', status: 'Active' }],
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
