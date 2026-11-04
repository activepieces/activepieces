import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxSendSalesReceiptOutputSchema } from '../../../output-schemas';

export const sendSalesReceiptAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_send_sales_receipt',
	outputSchema: quickbooksSandboxSendSalesReceiptOutputSchema,
	displayName: 'Send Sales Receipt',
	description: 'Emails a sales receipt to the customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Emails one sales receipt as a PDF, to Send To or, when empty, to the billing email on the sales receipt. Each call sends another email. Get the id from List Sales Receipts.',
		idempotent: false,
	},
	props: {
		salesReceiptId: quickbooksAiProps.id({
			required: true,
			displayName: 'Sales Receipt ID',
			description: 'QuickBooks sales receipt id. Use List Sales Receipts to find it.',
		}),
		sendTo: quickbooksAiProps.sendTo({ required: false }),
	},
	async run(context) {
		return await quickbooksApi.sendEntity({
			auth: context.auth,
			entity: 'SalesReceipt',
			id: context.propsValue.salesReceiptId,
			sendTo: context.propsValue.sendTo,
		});
	},
});
