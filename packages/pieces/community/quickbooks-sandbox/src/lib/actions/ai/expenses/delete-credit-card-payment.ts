import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteCreditCardPaymentOutputSchema } from '../../../output-schemas';

export const deleteCreditCardPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_credit_card_payment',
	outputSchema: quickbooksSandboxDeleteCreditCardPaymentOutputSchema,
	displayName: 'Delete Credit Card Payment',
	description: 'Permanently deletes a credit card payment.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one credit card payment; it cannot be restored. Reads the latest SyncToken first. Get the id from List Credit Card Payments.',
		idempotent: false,
	},
	props: {
		creditCardPaymentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Credit Card Payment ID',
			description: 'QuickBooks credit card payment id. Use List Credit Card Payments to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'CreditCardPayment',
			id: context.propsValue.creditCardPaymentId,
		});
	},
});
