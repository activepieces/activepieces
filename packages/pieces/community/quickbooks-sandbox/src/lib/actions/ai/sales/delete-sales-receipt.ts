import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteSalesReceiptOutputSchema } from '../../../output-schemas';

export const deleteSalesReceiptAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_sales_receipt',
	outputSchema: quickbooksSandboxDeleteSalesReceiptOutputSchema,
	displayName: 'Delete Sales Receipt',
	description: 'Permanently deletes a sales receipt.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one sales receipt; it cannot be restored. Use Void Sales Receipt instead to keep the record with zero amounts. Get the id from List Sales Receipts.',
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
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'SalesReceipt',
			id: context.propsValue.salesReceiptId,
		});
	},
});
