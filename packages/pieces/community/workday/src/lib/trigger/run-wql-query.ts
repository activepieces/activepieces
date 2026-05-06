import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, Property, StaticPropsValue, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { workdayAuth } from '../auth';
import { workdayWqlRequest } from '../common';

const props = {
	query: Property.LongText({
		displayName: 'WQL Query',
		description: 'The Workday Query Language (WQL) query to execute. Must include a date/timestamp column for deduplication.',
		required: true,
	}),
	dateField: Property.ShortText({
		displayName: 'Date Field Name',
		description: 'The name of the date/timestamp field in your query results used for detecting new records (e.g., "createdDate").',
		required: true,
		defaultValue: 'createdDate',
	}),
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof workdayAuth>, StaticPropsValue<typeof props>> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const response = await workdayWqlRequest<{ data: Record<string, unknown>[] }>(auth, propsValue.query);
		const dateField = propsValue.dateField;
		const items = response.body.data ?? [];
		return items
			.filter((item) => {
				const dateValue = item[dateField];
				if (typeof dateValue !== 'string') return false;
				return dayjs(dateValue).valueOf() > lastFetchEpochMS;
			})
			.map((item) => ({ epochMilliSeconds: dayjs(item[dateField] as string).valueOf(), data: item }));
	},
};

export const runWqlQuery = createTrigger({
	auth: workdayAuth,
	name: 'run_wql_query',
	displayName: 'Run WQL Query',
	description: 'Triggers when new records are returned by a Workday Query Language (WQL) query.',
	props,
	sampleData: { id: 'record-001', createdDate: '2026-04-01T10:00:00Z', descriptor: 'Sample Record' },
	type: TriggerStrategy.POLLING,
	async test(ctx) { return await pollingHelper.test(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files }); },
	async onEnable(ctx) { await pollingHelper.onEnable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue }); },
	async onDisable(ctx) { await pollingHelper.onDisable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue }); },
	async run(ctx) { return await pollingHelper.poll(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files }); },
});
