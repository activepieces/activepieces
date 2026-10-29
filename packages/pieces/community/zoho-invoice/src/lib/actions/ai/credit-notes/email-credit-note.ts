import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const emailCreditNoteAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_email_credit_note',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Email Credit Note',
	description: 'Emails a credit note to the customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends a real email with the credit note to the given recipients. Use List Credit Notes to find the ID. Not idempotent: every call sends another email.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
		toMailIds: Property.Array({
			displayName: 'To',
			description: 'Recipient email addresses.',
			required: true,
		}),
		ccMailIds: Property.Array({
			displayName: 'CC',
			description: 'CC email addresses.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Email subject.',
			required: true,
		}),
		body: Property.LongText({
			displayName: 'Body',
			description: 'Email body (HTML allowed).',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.emailCreditNote({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
			body: zohoInvoiceUtils.compact({
				to_mail_ids: propsValue.toMailIds,
				cc_mail_ids: propsValue.ccMailIds,
				subject: propsValue.subject,
				body: propsValue.body,
			}),
		});
	},
});
