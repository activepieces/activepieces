import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteBillPaymentOutputSchema } from '../../../output-schemas';

export const deleteBillPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_bill_payment',
	outputSchema: quickbooksSandboxDeleteBillPaymentOutputSchema,
	displayName: 'Delete Bill Payment',
	description: 'Permanently deletes a bill payment.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one bill payment; it cannot be restored. Reads the latest SyncToken first. The bills it paid become open again; use Void Bill Payment instead to keep the payment on record at zero. Get the id from List Bill Payments.',
		idempotent: false,
	},
	props: {
		billPaymentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Bill Payment ID',
			description: 'QuickBooks bill payment id. Use List Bill Payments to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'BillPayment',
			id: context.propsValue.billPaymentId,
		});
	},
});
