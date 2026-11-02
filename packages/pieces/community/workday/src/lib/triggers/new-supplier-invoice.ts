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
			typeIds: [SUPPLIER_INVOICE_EVENT_TYPE_ID],
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

export const newSupplierInvoiceTrigger = createTrigger({
	auth: workdayAuth,
	name: 'new_supplier_invoice',
	classification: 'READ',
	displayName: 'New Supplier Invoice',
	description: 'Triggers when a new supplier invoice is created in Workday.',
	aiMetadata: {
		description:
			'Fires when a new supplier invoice is created in Workday, detected by polling Supplier Invoice Event business process transactions by their initiation time. Represents a supplier-invoice creation event. Use to route invoices into approval, accounting, or payment automation.',
	},
	props: {},
	sampleData: {
		id: 'inv-001',
		descriptor: 'Invoice #12345 - Acme Corp',
		createdDate: '2026-04-01T12:00:00Z',
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

const SUPPLIER_INVOICE_EVENT_TYPE_ID = '48b49c6d25a74247b7b9d0d6f6593d72';
