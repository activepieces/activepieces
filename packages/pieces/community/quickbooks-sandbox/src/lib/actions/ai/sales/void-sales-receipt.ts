import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxVoidSalesReceiptOutputSchema } from '../../../output-schemas';

export const voidSalesReceiptAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_void_sales_receipt',
	outputSchema: quickbooksSandboxVoidSalesReceiptOutputSchema,
	displayName: 'Void Sales Receipt',
	description: 'Voids a sales receipt, keeping it on record with zero amounts.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Voids one sales receipt: its amounts become zero and it stays on record marked Voided, unlike Delete Sales Receipt which removes it. Cannot be undone. Get the id from List Sales Receipts.',
		idempotent: false,
	},
	props: {
		salesReceiptId: quickbooksAiProps.id({
			required: true,
			displayName: 'Sales Receipt ID',
			description: 'QuickBooks sales receipt id. Use List Sales Receipts to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.voidWithUpdate({
			auth: context.auth,
			entity: 'SalesReceipt',
			id: context.propsValue.salesReceiptId,
		});
	},
});
