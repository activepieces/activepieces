import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	StaticPropsValue,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { workdayAuth } from '../auth';
import { workdayWqlRequestAll } from '../common';
import { flattenRecord } from '../common/fields';
import { dateFieldProperty, wqlQueryProperty } from '../common/props';

const props = {
	query: wqlQueryProperty,
	dateField: dateFieldProperty,
};

const polling: Polling<
	AppConnectionValueForAuthProperty<typeof workdayAuth>,
	StaticPropsValue<typeof props>
> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const records = await workdayWqlRequestAll(auth, propsValue.query);
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
		const flattened = limited.map((row) => flattenRecord(row));
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

export const scheduledReportFetchWqlBatch = createTrigger({
	auth: workdayAuth,
	name: 'scheduled_report_fetch_wql_batch',
	displayName: 'Scheduled Report Fetch using WQL (Batch)',
	description:
		'Polls a WQL query on a schedule and returns matching rows as a batch.',
	props,
	sampleData: {
		total_count: 1,
		records: [{ employee_id: 'worker-001', name: 'Jane Doe', status: 'Active' }],
	},
	type: TriggerStrategy.POLLING,
	async test(ctx) {
		return await pollingHelper.test(polling, {
			auth: ctx.auth,
			store: ctx.store,
			propsValue: ctx.propsValue,
			files: ctx.files,
		});
	},
	async onEnable(ctx) {
		await pollingHelper.onEnable(polling, {
			auth: ctx.auth,
			store: ctx.store,
			propsValue: ctx.propsValue,
		});
	},
	async onDisable(ctx) {
		await pollingHelper.onDisable(polling, {
			auth: ctx.auth,
			store: ctx.store,
			propsValue: ctx.propsValue,
		});
	},
	async run(ctx) {
		return await pollingHelper.poll(polling, {
			auth: ctx.auth,
			store: ctx.store,
			propsValue: ctx.propsValue,
			files: ctx.files,
		});
	},
});
