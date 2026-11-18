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
	reportId: workdayProps.reportId({ required: true }),
	reportParameters: workdayProps.reportParameters({ required: false }),
};

const polling: Polling<
	AppConnectionValueForAuthProperty<typeof workdayAuth>,
	StaticPropsValue<typeof props>
> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const isTest = lastFetchEpochMS === 0;
		const report = await workdayApi.getReport({
			auth,
			report: propsValue.reportId,
			parameters: propsValue.reportParameters,
		});
		const rows = report.format === 'json' ? report.rows : [];

		const limitedRows = isTest ? rows.slice(0, 10) : rows;
		const flattened = limitedRows.map((row) => workdayUtils.flattenRecord({ value: row }));
		if (flattened.length === 0) {
			return [];
		}

		return [
			{
				epochMilliSeconds: Date.now(),
				data: {
					total_count: flattened.length,
					records: flattened,
					report_id: report.reportPath,
					fetched_at: dayjs().toISOString(),
				},
			},
		];
	},
};

export const scheduledReportFetchBatchTrigger = createTrigger({
	auth: workdayAuth,
	name: 'scheduled_report_fetch_batch',
	classification: 'READ',
	displayName: 'Scheduled Report Fetch (Batch)',
	description: 'Polls a Workday report on a schedule and returns all rows as a batch.',
	aiMetadata: {
		description:
			'Fires on every poll with the full row set of a Workday custom report enabled as a web service (RaaS), identified by its RaaS URL or `owner/report_name` and optionally given prompt values keyed by prompt XML alias. The whole report is re-fetched each cycle rather than only changed rows, so treat it as a scheduled extract, not a change feed. Use Scheduled Report Fetch using WQL (Batch) instead when the data comes from a WQL query.',
	},
	props,
	sampleData: {
		total_count: 1,
		report_id: 'lmcneil/PT_Workers',
		records: [{ employee_id: 'worker-001', name: 'Jane Doe' }],
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
