import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetCreditMemoPdfOutputSchema } from '../../../output-schemas';

export const getRefundReceiptPdfAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_refund_receipt_pdf',
	outputSchema: quickbooksSandboxGetCreditMemoPdfOutputSchema,
	displayName: 'Get Refund Receipt PDF',
	description: 'Downloads a refund receipt as a PDF file.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Downloads one refund receipt as a PDF and returns it as a file reference. Get the id from List Refund Receipts.',
		idempotent: true,
	},
	props: {
		refundReceiptId: quickbooksAiProps.id({
			required: true,
			displayName: 'Refund Receipt ID',
			description: 'QuickBooks refund receipt id. Use List Refund Receipts to find it.',
		}),
	},
	async run(context) {
		const { refundReceiptId } = context.propsValue;
		const data = await quickbooksApi.downloadPdf({ auth: context.auth, entity: 'RefundReceipt', id: refundReceiptId });
		const fileName = `refund-receipt-${refundReceiptId}.pdf`;
		const file = await context.files.write({ fileName, data });
		return { file, fileName };
	},
});
