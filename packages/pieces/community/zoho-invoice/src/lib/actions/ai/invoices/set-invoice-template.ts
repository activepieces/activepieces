import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const setInvoiceTemplateAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_set_invoice_template',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Set Invoice Template',
	description: 'Changes the PDF template of an invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes which PDF template an invoice is rendered with. Use List Invoices for the invoice ID and List Invoice Templates for the template ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
		templateId: zohoInvoiceAiProps.templateId({
			required: true,
			description: 'Invoice PDF template ID. Use List Invoice Templates to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.setInvoiceTemplate({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
			templateId: propsValue.templateId,
		});
	},
});
