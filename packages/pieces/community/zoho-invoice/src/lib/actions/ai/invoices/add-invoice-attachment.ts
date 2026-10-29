import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceAddInvoiceAttachmentOutputSchema } from '../../../output-schemas';

export const addInvoiceAttachmentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_add_invoice_attachment',
	outputSchema: zohoInvoiceAddInvoiceAttachmentOutputSchema,
	displayName: 'Add Invoice Attachment',
	description: 'Attaches a file to an invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads a file and attaches it to an invoice. Use Get Invoice Attachment to download it and Delete Invoice Attachment to remove it. Use List Invoices to find the ID. Not idempotent.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
		file: Property.File({
			displayName: 'File',
			description: 'File to attach.',
			required: true,
		}),
		canSendInMail: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Send With Email',
			description: 'Yes to include this file when the invoice is emailed.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.addInvoiceAttachment({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
			file: propsValue.file,
			canSendInMail: zohoInvoiceUtils.toOptionalBoolean({ value: propsValue.canSendInMail }),
		});
	},
});
