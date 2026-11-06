import dayjs from 'dayjs';

import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	Property,
	StaticPropsValue,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';

const props = {
	query: Property.LongText({
		displayName: 'WQL Query',
		description:
			'The Workday Query Language (WQL) query to execute. Must include a date/timestamp column for deduplication.',
		required: true,
	}),
	dateField: Property.ShortText({
		displayName: 'Date Field Name',
		description:
			'The name of the date/timestamp field in your query results used for detecting new records (e.g., "createdDate").',
		required: true,
		defaultValue: 'createdDate',
	}),
};

const polling: Polling<
	AppConnectionValueForAuthProperty<typeof workdayAuth>,
	StaticPropsValue<typeof props>
> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const page = await workdayApi.runWql({ auth, query: propsValue.query });
		const dateField = propsValue.dateField;
		const items = page.data ?? [];
		return items.flatMap((item) => {
			const dateValue = item[dateField];
			if (typeof dateValue !== 'string') return [];
			const epochMilliSeconds = dayjs(dateValue).valueOf();
			return epochMilliSeconds > lastFetchEpochMS ? [{ epochMilliSeconds, data: item }] : [];
		});
	},
};

export const runWqlQueryTrigger = createTrigger({
	auth: workdayAuth,
	name: 'run_wql_query',
	classification: 'READ',
	displayName: 'Run WQL Query',
	description: 'Triggers when new records are returned by a Workday Query Language (WQL) query.',
	aiMetadata: {
		description:
			'Fires when a custom Workday Query Language (WQL) query returns rows newer than the last poll, judged by a caller-named date/timestamp field. General-purpose change detector for any Workday dataset; use when no dedicated trigger fits. The query must select a date column and you must name it in the Date Field input.',
	},
	props,
	sampleData: {
		id: 'record-001',
		createdDate: '2026-04-01T10:00:00Z',
		descriptor: 'Sample Record',
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
