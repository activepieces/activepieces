import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { quickbooksAuth } from '../auth';
import { quickbooksApi } from '../common/api';
import type { QuickbooksBill } from '../common/types';
import { newBillOutputSchema } from '../output-schemas';

const polling: Polling<AppConnectionValueForAuthProperty<typeof quickbooksAuth>, Record<string, unknown>> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		const records = await quickbooksApi.listChangedEntities<QuickbooksBill>({
			auth,
			entity: 'Bill',
			lastFetchEpochMS,
			newOnly: true,
		});

		return records.map((record) => ({
			epochMilliSeconds: dayjs(record.MetaData?.LastUpdatedTime ?? record.MetaData?.CreateTime).valueOf(),
			data: record,
		}));
	},
};

export const newBill = createTrigger({
	auth: quickbooksAuth,
	name: 'new_bill',
	outputSchema: newBillOutputSchema,
	displayName: 'New Bill',
	description: 'Triggers when a new bill (accounts payable) is created in QuickBooks.',
	aiMetadata: {
		description: 'Fires when a new vendor bill is created in the connected QuickBooks company, emitting the bill record. Use to react to new accounts-payable obligations, e.g. to route bills for approval.',
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
