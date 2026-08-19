import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../lib/auth';
import { createQuickbooksCdcPolling } from '../lib/cdc-polling';
import { QuickbooksBill } from '../lib/types';

const polling = createQuickbooksCdcPolling<QuickbooksBill>({
	entity: 'Bill',
	newOnly: true,
});

export const newBill = createTrigger({
	auth: quickbooksAuth,
	name: 'new_bill',
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
