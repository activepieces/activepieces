import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxVoidBillPaymentOutputSchema } from '../../../output-schemas';

export const voidBillPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_void_bill_payment',
	outputSchema: quickbooksSandboxVoidBillPaymentOutputSchema,
	displayName: 'Void Bill Payment',
	description: 'Voids a bill payment.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Voids one bill payment: it stays on record with a zero amount and the bills it paid become open again. Cannot be undone; pick it over Delete Bill Payment to keep an audit trail. Get the id from List Bill Payments.',
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
		return await quickbooksApi.voidWithUpdate({
			auth: context.auth,
			entity: 'BillPayment',
			id: context.propsValue.billPaymentId,
		});
	},
});
