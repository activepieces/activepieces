import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreatePaymentOutputSchema } from '../../../output-schemas';

export const getPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_payment',
	outputSchema: quickbooksSandboxCreatePaymentOutputSchema,
	displayName: 'Get Payment',
	description: 'Gets one payment by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one received payment with its total, unapplied amount, the invoices it is applied to and its SyncToken. Get the id from List Payments or Create Payment.',
		idempotent: true,
	},
	props: {
		paymentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Payment ID',
			description: 'QuickBooks payment id. Use List Payments to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Payment',
			id: context.propsValue.paymentId,
		});
	},
});
