import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateBillPaymentOutputSchema } from '../../../output-schemas';

export const getBillPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_bill_payment',
	outputSchema: quickbooksSandboxCreateBillPaymentOutputSchema,
	displayName: 'Get Bill Payment',
	description: 'Gets one bill payment by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one bill payment with its pay type, the bills it pays (Line LinkedTxn) and SyncToken. Get the id from List Bill Payments or Create Bill Payment.',
		idempotent: true,
	},
	props: {
		billPaymentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Bill Payment ID',
			description: 'QuickBooks bill payment id. Use List Bill Payments to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'BillPayment',
			id: context.propsValue.billPaymentId,
		});
	},
});
