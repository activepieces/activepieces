import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateSalesReceiptOutputSchema } from '../../../output-schemas';

export const getSalesReceiptAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_sales_receipt',
	outputSchema: quickbooksSandboxCreateSalesReceiptOutputSchema,
	displayName: 'Get Sales Receipt',
	description: 'Gets one sales receipt by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one sales receipt with its lines, totals, deposit account and SyncToken. Get the id from List Sales Receipts or Create Sales Receipt.',
		idempotent: true,
	},
	props: {
		salesReceiptId: quickbooksAiProps.id({
			required: true,
			displayName: 'Sales Receipt ID',
			description: 'QuickBooks sales receipt id. Use List Sales Receipts to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'SalesReceipt',
			id: context.propsValue.salesReceiptId,
		});
	},
});
