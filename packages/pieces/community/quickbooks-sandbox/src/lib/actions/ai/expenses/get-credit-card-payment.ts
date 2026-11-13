import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateCreditCardPaymentOutputSchema } from '../../../output-schemas';

export const getCreditCardPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_credit_card_payment',
	outputSchema: quickbooksSandboxCreateCreditCardPaymentOutputSchema,
	displayName: 'Get Credit Card Payment',
	description: 'Gets one credit card payment by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one credit card payment with its credit card and bank accounts, amount and SyncToken. Get the id from List Credit Card Payments or Create Credit Card Payment.',
		idempotent: true,
	},
	props: {
		creditCardPaymentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Credit Card Payment ID',
			description: 'QuickBooks credit card payment id. Use List Credit Card Payments to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'CreditCardPayment',
			id: context.propsValue.creditCardPaymentId,
		});
	},
});
