import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceCreditNoteOutputSchema } from '../../../output-schemas';

export const createCreditNoteAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_credit_note',
	outputSchema: zohoInvoiceCreditNoteOutputSchema,
	displayName: 'Create Credit Note',
	description: 'Creates a credit note for a customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a credit note for a customer with one or more line items, optionally raised against an invoice. Use List Contacts for the customer ID and List Invoices for the invoice ID. Not idempotent: each call creates a new credit note.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		customerId: zohoInvoiceAiProps.contactId({ required: true, displayName: 'Customer ID' }),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'Credit note date, yyyy-mm-dd.',
			required: true,
		}),
		lineItems: Property.Array({
			displayName: 'Line Items',
			description: 'Items being credited.',
			required: true,
			properties: {
				itemId: zohoInvoiceAiProps.itemId({ required: false }),
				name: Property.ShortText({
					displayName: 'Name',
					description: 'Line name. Empty = the item name.',
					required: false,
				}),
				description: Property.ShortText({
					displayName: 'Description',
					description: 'Line description.',
					required: false,
				}),
				rate: Property.Number({
					displayName: 'Rate',
					description: 'Unit price. Empty = the item rate.',
					required: false,
				}),
				quantity: Property.Number({
					displayName: 'Quantity',
					description: 'Quantity. Empty = 1.',
					required: false,
				}),
				taxId: zohoInvoiceAiProps.taxId({ required: false }),
			},
		}),
		creditNoteNumber: Property.ShortText({
			displayName: 'Credit Note Number',
			description:
				'Credit note number. Needed only when auto-numbering is off or Ignore Auto Number Generation is Yes.',
			required: false,
		}),
		ignoreAutoNumberGeneration: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Ignore Auto Number Generation',
			description: 'Yes = use Credit Note Number instead of the next auto-generated number.',
		}),
		invoiceId: zohoInvoiceAiProps.invoiceId({
			required: false,
			description: 'Invoice the credit note is raised against. Use List Invoices to find it.',
		}),
		referenceNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'Your own reference for the credit note.',
			required: false,
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'Notes shown on the credit note.',
			required: false,
		}),
		terms: Property.LongText({
			displayName: 'Terms',
			description: 'Terms and conditions shown on the credit note.',
			required: false,
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createCreditNote({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
			ignoreAutoNumberGeneration: zohoInvoiceUtils.toOptionalBoolean({
				value: propsValue.ignoreAutoNumberGeneration,
			}),
			body: {
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					customer_id: propsValue.customerId,
					date: propsValue.date,
					line_items: zohoInvoiceUtils.toLineItems({ rows: propsValue.lineItems }),
					creditnote_number: propsValue.creditNoteNumber,
					reference_number: propsValue.referenceNumber,
					notes: propsValue.notes,
					terms: propsValue.terms,
				}),
			},
		});
	},
});
