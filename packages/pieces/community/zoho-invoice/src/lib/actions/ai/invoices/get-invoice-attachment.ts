import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceGetInvoiceAttachmentOutputSchema } from '../../../output-schemas';

export const getInvoiceAttachmentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_invoice_attachment',
	outputSchema: zohoInvoiceGetInvoiceAttachmentOutputSchema,
	displayName: 'Get Invoice Attachment',
	description: 'Downloads the file attached to an invoice.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Downloads the file attached to an invoice and returns the stored file. Use Add Invoice Attachment to attach one and List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
	},
	async run(context) {
		const { organizationId, invoiceId } = context.propsValue;
		const content = await zohoInvoiceApi.getInvoiceAttachment({
			auth: context.auth,
			organizationId,
			invoiceId,
		});
		const fileName = `invoice-${invoiceId}-attachment`;
		const file = await context.files.write({ fileName, data: Buffer.from(content) });
		return { file, fileName };
	},
});
