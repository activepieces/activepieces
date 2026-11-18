import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeletePaymentOutputSchema } from '../../../output-schemas';

export const deletePaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_payment',
	outputSchema: quickbooksSandboxDeletePaymentOutputSchema,
	displayName: 'Delete Payment',
	description: 'Permanently deletes a payment.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one payment and unapplies it from its invoices; it cannot be restored. Use Void Payment instead to keep the record. Get the id from List Payments.',
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
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'Payment',
			id: context.propsValue.paymentId,
		});
	},
});
