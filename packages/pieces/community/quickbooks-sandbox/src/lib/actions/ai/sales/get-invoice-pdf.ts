import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetCreditMemoPdfOutputSchema } from '../../../output-schemas';

export const getInvoicePdfAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_invoice_pdf',
	outputSchema: quickbooksSandboxGetCreditMemoPdfOutputSchema,
	displayName: 'Get Invoice PDF',
	description: 'Downloads an invoice as a PDF file.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Downloads one invoice as a PDF and returns it as a file reference. Get the id from List Invoices.',
		idempotent: true,
	},
	props: {
		invoiceId: quickbooksAiProps.id({
			required: true,
			displayName: 'Invoice ID',
			description: 'QuickBooks invoice id. Use List Invoices to find it.',
		}),
	},
	async run(context) {
		const { invoiceId } = context.propsValue;
		const data = await quickbooksApi.downloadPdf({ auth: context.auth, entity: 'Invoice', id: invoiceId });
		const fileName = `invoice-${invoiceId}.pdf`;
		const file = await context.files.write({ fileName, data });
		return { file, fileName };
	},
});
