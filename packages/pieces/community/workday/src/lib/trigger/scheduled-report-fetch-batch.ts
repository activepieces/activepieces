import {
	DedupeStrategy,
	Polling,
	QueryParams,
	pollingHelper,
} from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	Property,
	StaticPropsValue,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { workdayAuth } from '../auth';
import { workdayGetReport } from '../common';
import { flattenRecord } from '../common/fields';
import { reportIdProperty } from '../common/props';

const props = {
	reportId: reportIdProperty,
	reportParameters: Property.Json({
		displayName: 'Report Parameters (JSON)',
		description: 'Optional report prompt values as JSON key-value pairs.',
		required: false,
	}),
};

const polling: Polling<
	AppConnectionValueForAuthProperty<typeof workdayAuth>,
	StaticPropsValue<typeof props>
> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const isTest = lastFetchEpochMS === 0;
		const report = await workdayGetReport(
			auth,
			propsValue.reportId,
			propsValue.reportParameters as QueryParams | undefined,
		);
		const rows = Array.isArray(report['data'])
			? (report['data'] as Record<string, unknown>[])
			: Array.isArray(report['Report_Entry'])
			? (report['Report_Entry'] as Record<string, unknown>[])
			: [report];

		const limitedRows = isTest ? rows.slice(0, 10) : rows;
		const flattened = limitedRows.map((row) => flattenRecord(row));
		if (flattened.length === 0) {
			return [];
		}

		return [
			{
				epochMilliSeconds: Date.now(),
				data: {
					total_count: flattened.length,
					records: flattened,
					report_id: propsValue.reportId,
					fetched_at: dayjs().toISOString(),
				},
			},
		];
	},
};

export const scheduledReportFetchBatch = createTrigger({
	auth: workdayAuth,
	name: 'scheduled_report_fetch_batch',
	displayName: 'Scheduled Report Fetch (Batch)',
	description:
		'Polls a Workday report on a schedule and returns all rows as a batch.',
	props,
	sampleData: {
		total_count: 1,
		report_id: 'Worker_Report',
		records: [{ employee_id: 'worker-001', name: 'Jane Doe' }],
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
