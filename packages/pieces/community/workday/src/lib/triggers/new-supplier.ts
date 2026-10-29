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
			typeIds: [SUPPLIER_EVENT_TYPE_ID],
		});
		return rows.map((row) => ({
			epochMilliSeconds: dayjs(String(row['dateAndTimeInitiated'])).valueOf(),
			data: {
				id: workdayUtils.readNestedId({ value: row['subject'] }),
				descriptor: workdayUtils.readNestedDescriptor({ value: row['subject'] }),
				createdDate: row['dateAndTimeInitiated'],
				...row,
			},
		}));
	},
};

export const newSupplierTrigger = createTrigger({
	auth: workdayAuth,
	name: 'new_supplier',
	classification: 'READ',
	displayName: 'New Supplier',
	description: 'Triggers when a new supplier is created in Workday.',
	aiMetadata: {
		description:
			'Fires when a new supplier is created in Workday, detected by polling Supplier Event business process transactions by their initiation time. Represents a supplier-creation event. Use to sync new vendors into downstream systems or kick off supplier onboarding.',
	},
	props: {},
	sampleData: { id: 'sup-001', descriptor: 'Acme Corp', createdDate: '2026-04-01T10:00:00Z' },
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

const SUPPLIER_EVENT_TYPE_ID = 'fbb860b6147b1000101faa99aeb40004';
