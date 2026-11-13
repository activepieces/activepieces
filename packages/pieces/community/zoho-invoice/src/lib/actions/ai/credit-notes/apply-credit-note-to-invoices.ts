import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceApplyCreditNoteToInvoicesOutputSchema } from '../../../output-schemas';

export const applyCreditNoteToInvoicesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_apply_credit_note_to_invoices',
	outputSchema: zohoInvoiceApplyCreditNoteToInvoicesOutputSchema,
	displayName: 'Apply Credit Note to Invoices',
	description: "Applies a credit note's credit to one or more invoices.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Applies part or all of a credit note's open balance to unpaid invoices of the same customer. Use List Credit Notes for the credit note ID and List Invoices for the invoice IDs. Not idempotent: repeating the call applies the credit again.",
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
		invoices: Property.Array({
			displayName: 'Invoices',
			description: 'Invoices to credit and the amount to apply to each.',
			required: true,
			properties: {
				invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
				amountApplied: Property.Number({
					displayName: 'Amount Applied',
					description: 'Credit amount to apply to this invoice.',
					required: true,
				}),
			},
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.applyCreditNoteToInvoices({
			auth,
			organizationId: propsValue.organizationId,
			creditNoteId: propsValue.creditNoteId,
			body: {
				invoices: zohoInvoiceUtils
					.toRecords({ rows: propsValue.invoices, propName: 'Invoices' })
					.map((invoice) =>
						zohoInvoiceUtils.compact({
							invoice_id: invoice['invoiceId'],
							amount_applied: invoice['amountApplied'],
						}),
					),
			},
		});
	},
});
