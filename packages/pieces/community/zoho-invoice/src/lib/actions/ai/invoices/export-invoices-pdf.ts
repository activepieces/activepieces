import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceGetInvoiceAttachmentOutputSchema } from '../../../output-schemas';

export const exportInvoicesPdfAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_export_invoices_pdf',
	outputSchema: zohoInvoiceGetInvoiceAttachmentOutputSchema,
	displayName: 'Export Invoices as PDF',
	description: 'Exports up to 25 invoices into one PDF file.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Exports up to 25 invoices into a single PDF file and returns the stored file. Use it for one invoice too. Use List Invoices to find the IDs.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceIds: Property.Array({
			displayName: 'Invoice IDs',
			description: 'IDs of the invoices to export (1-25). Use List Invoices to find them.',
			required: true,
		}),
	},
	async run(context) {
		const { invoiceIds, organizationId } = context.propsValue;
		if (
			invoiceIds.length === 0 ||
			invoiceIds.length > MAX_INVOICES ||
			!invoiceIds.every((id): id is string => typeof id === 'string' && id !== '')
		) {
			throw new Error(`Invoice IDs must be a list of 1 to ${MAX_INVOICES} invoice ID strings.`);
		}
		const content = await zohoInvoiceApi.exportInvoicesPdf({
			auth: context.auth,
			organizationId,
			invoiceIds,
		});
		const fileName = 'invoices.pdf';
		const file = await context.files.write({ fileName, data: Buffer.from(content) });
		return { file, fileName };
	},
});

const MAX_INVOICES = 25;
