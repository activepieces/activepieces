import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../lib/auth';
import { createQuickbooksCdcPolling } from '../lib/cdc-polling';
import { QuickbooksPayment } from '../lib/types';

const polling = createQuickbooksCdcPolling<QuickbooksPayment>({
	entity: 'Payment',
	newOnly: true,
});

export const paymentReceived = createTrigger({
	auth: quickbooksAuth,
	name: 'payment_received',
	displayName: 'Payment Received',
	description: 'Triggers when a new customer payment is recorded in QuickBooks.',
	aiMetadata: {
		description: 'Fires when a new payment from a customer is recorded in the connected QuickBooks company, emitting the payment record. Use to react to money coming in, e.g. to send a receipt or update a CRM.',
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
