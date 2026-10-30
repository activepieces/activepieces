import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceCreditNoteOutputSchema } from '../../../output-schemas';

export const updateCreditNoteAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_credit_note',
	outputSchema: zohoInvoiceCreditNoteOutputSchema,
	displayName: 'Update Credit Note',
	description: 'Changes the details or line items of a credit note.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes a credit note. Fields left empty keep their current value; Line Items, when given, replace all current lines (pass Line Item ID to keep an existing line). Use List Credit Notes to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		creditNoteId: zohoInvoiceAiProps.creditNoteId({ required: true }),
		customerId: zohoInvoiceAiProps.contactId({
			required: false,
			displayName: 'Customer ID',
			description: 'New customer ID. Use List Contacts to find it. Empty = unchanged.',
		}),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'New credit note date, yyyy-mm-dd. Empty = unchanged.',
			required: false,
		}),
		creditNoteNumber: Property.ShortText({
			displayName: 'Credit Note Number',
			description: 'New credit note number. Empty = unchanged.',
			required: false,
		}),
		lineItems: Property.Array({
			displayName: 'Line Items',
			description:
				'Full new list of lines. Lines without a Line Item ID are added; current lines left out are removed. Empty = lines unchanged.',
			required: false,
			properties: {
				lineItemId: zohoInvoiceAiProps.idProp({
					required: false,
					displayName: 'Line Item ID',
					description: 'ID of an existing line to keep. Use Get Credit Note to find it.',
				}),
				itemId: zohoInvoiceAiProps.itemId({ required: false }),
				name: Property.ShortText({
					displayName: 'Name',
					description: 'Line name.',
					required: false,
				}),
				description: Property.ShortText({
					displayName: 'Description',
					description: 'Line description.',
					required: false,
				}),
				rate: Property.Number({
					displayName: 'Rate',
					description: 'Unit price.',
					required: false,
				}),
				quantity: Property.Number({
					displayName: 'Quantity',
					description: 'Quantity.',
					required: false,
				}),
				taxId: zohoInvoiceAiProps.taxId({ required: false }),
			},
		}),
		referenceNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'New reference number. Empty = unchanged.',
			required: false,
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'New notes. Empty = unchanged.',
			required: false,
		}),
		terms: Property.LongText({
			displayName: 'Terms',
			description: 'New terms and conditions. Empty = unchanged.',
			required: false,
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		const { organizationId, creditNoteId } = propsValue;
		const current = await zohoInvoiceApi.getCreditNote({ auth, organizationId, creditNoteId });
		return await zohoInvoiceApi.updateCreditNote({
			auth,
			organizationId,
			creditNoteId,
			ignoreAutoNumberGeneration: propsValue.creditNoteNumber ? true : undefined,
			body: {
				...zohoInvoiceUtils.compact({
					customer_id: current.creditnote?.customer_id,
					date: current.creditnote?.date,
					creditnote_number: current.creditnote?.creditnote_number,
					line_items: current.creditnote?.line_items?.map((line) =>
						zohoInvoiceUtils.compact({
							line_item_id: line.line_item_id,
							item_id: line.item_id,
							name: line.name,
							description: line.description,
							rate: line.rate,
							quantity: line.quantity,
							discount: line.discount,
							tax_id: line.tax_id,
						}),
					),
				}),
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					customer_id: propsValue.customerId,
					date: propsValue.date,
					creditnote_number: propsValue.creditNoteNumber,
					line_items:
						propsValue.lineItems === undefined
							? undefined
							: zohoInvoiceUtils.toLineItems({ rows: propsValue.lineItems }),
					reference_number: propsValue.referenceNumber,
					notes: propsValue.notes,
					terms: propsValue.terms,
				}),
			},
		});
	},
});
