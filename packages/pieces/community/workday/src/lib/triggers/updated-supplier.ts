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
			typeIds: [SUPPLIER_CHANGE_EVENT_TYPE_ID],
			completedOnly: true,
		});
		return rows.map((row) => ({
			epochMilliSeconds: dayjs(String(row['dateAndTimeCompleted'])).valueOf(),
			data: {
				id: workdayUtils.readNestedId({ value: row['subject'] }),
				descriptor: workdayUtils.readNestedDescriptor({ value: row['subject'] }),
				lastUpdated: row['dateAndTimeCompleted'],
				...row,
			},
		}));
	},
};

export const updatedSupplierTrigger = createTrigger({
	auth: workdayAuth,
	name: 'updated_supplier',
	classification: 'READ',
	displayName: 'Updated Supplier',
	description: 'Triggers when a supplier is updated in Workday.',
	aiMetadata: {
		description:
			'Fires when an existing supplier record is updated in Workday (polling). Use to react to supplier changes such as contact, banking, or status updates.',
	},
	props: {},
	sampleData: { id: 'sup-001', descriptor: 'Acme Corp', lastUpdated: '2026-04-01T10:00:00Z' },
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

const SUPPLIER_CHANGE_EVENT_TYPE_ID = '753afb929c24100007bb327a66aa0011';
