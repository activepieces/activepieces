import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxSendPaymentOutputSchema } from '../../../output-schemas';

export const voidPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_void_payment',
	outputSchema: quickbooksSandboxSendPaymentOutputSchema,
	displayName: 'Void Payment',
	description: 'Voids a payment, keeping it on record with zero amounts.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Voids one payment: its amount becomes zero, it is unapplied from its invoices and stays on record marked Voided, unlike Delete Payment which removes it. Cannot be undone. Get the id from List Payments.',
		idempotent: false,
	},
	props: {
		paymentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Payment ID',
			description: 'QuickBooks payment id. Use List Payments to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.voidWithUpdate({
			auth: context.auth,
			entity: 'Payment',
			id: context.propsValue.paymentId,
		});
	},
});
