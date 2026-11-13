import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateRecurringTransactionOutputSchema } from '../../../output-schemas';

export const getRecurringTransactionAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_recurring_transaction',
	outputSchema: quickbooksSandboxCreateRecurringTransactionOutputSchema,
	displayName: 'Get Recurring Transaction',
	description: 'Gets one recurring transaction by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one recurring transaction template, wrapped in its transaction type (e.g. {"Bill": {..., "RecurringInfo": {...}}}), with its schedule and SyncToken. Needs QuickBooks Online Essentials or higher. Get the id from List Recurring Transactions or Create Recurring Transaction.',
		idempotent: true,
	},
	props: {
		recurringTransactionId: quickbooksAiProps.id({
			required: true,
			displayName: 'Recurring Transaction ID',
			description: 'QuickBooks recurring transaction id. Use List Recurring Transactions to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'RecurringTransaction',
			id: context.propsValue.recurringTransactionId,
		});
	},
});
