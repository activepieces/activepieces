import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../lib/auth';
import { createQuickbooksCdcPolling } from '../lib/cdc-polling';
import { QuickbooksInvoice } from '../lib/types';

const polling = createQuickbooksCdcPolling<QuickbooksInvoice>({
	entity: 'Invoice',
	newOnly: false,
});

export const newOrUpdatedInvoice = createTrigger({
	auth: quickbooksAuth,
	name: 'new_or_updated_invoice',
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
