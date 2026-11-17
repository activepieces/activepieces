import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { quickbooksAuth } from '../auth';
import { quickbooksApi } from '../common/api';
import type { QuickbooksInvoice } from '../common/types';
import { newOrUpdatedInvoiceOutputSchema } from '../output-schemas';

const polling: Polling<AppConnectionValueForAuthProperty<typeof quickbooksAuth>, Record<string, unknown>> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		const records = await quickbooksApi.listChangedEntities<QuickbooksInvoice>({
			auth,
			entity: 'Invoice',
			lastFetchEpochMS,
			newOnly: false,
		});

		return records.map((record) => ({
			epochMilliSeconds: dayjs(record.MetaData?.LastUpdatedTime ?? record.MetaData?.CreateTime).valueOf(),
			data: record,
		}));
	},
};

export const newOrUpdatedInvoice = createTrigger({
	auth: quickbooksAuth,
	name: 'new_or_updated_invoice',
	outputSchema: newOrUpdatedInvoiceOutputSchema,
	displayName: 'New or Updated Invoice',
	description: 'Triggers when an invoice is created or updated in QuickBooks.',
	aiMetadata: {
		description: 'Fires when an invoice is created or changed (e.g. line items, balance, or status updated) in the connected QuickBooks company, emitting the invoice record. Use to keep an external system in sync with invoice changes, not just creation.',
	},
	props: {},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
	sampleData: undefined,
});
