import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetCreditMemoPdfOutputSchema } from '../../../output-schemas';

export const getSalesReceiptPdfAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_sales_receipt_pdf',
	outputSchema: quickbooksSandboxGetCreditMemoPdfOutputSchema,
	displayName: 'Get Sales Receipt PDF',
	description: 'Downloads a sales receipt as a PDF file.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Downloads one sales receipt as a PDF and returns it as a file reference. Get the id from List Sales Receipts.',
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
		const { salesReceiptId } = context.propsValue;
		const data = await quickbooksApi.downloadPdf({ auth: context.auth, entity: 'SalesReceipt', id: salesReceiptId });
		const fileName = `sales-receipt-${salesReceiptId}.pdf`;
		const file = await context.files.write({ fileName, data });
		return { file, fileName };
	},
});
