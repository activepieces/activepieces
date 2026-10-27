import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const setCreditNoteTemplateAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_set_credit_note_template',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Set Credit Note Template',
	description: 'Changes the PDF template of a credit note.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets which PDF template a credit note uses. Use List Credit Notes for the credit note ID and List Credit Note Templates for the template ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
		templateId: zohoInvoiceAiProps.templateId({
			required: true,
			description: 'Credit note PDF template ID. Use List Credit Note Templates to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.setCreditNoteTemplate({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
			templateId: propsValue.templateId,
		});
	},
});
