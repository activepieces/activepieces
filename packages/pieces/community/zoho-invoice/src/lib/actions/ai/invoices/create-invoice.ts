import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceInvoiceOutputSchema } from '../../../output-schemas';

export const createInvoiceAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_invoice',
	outputSchema: zohoInvoiceInvoiceOutputSchema,
	displayName: 'Create Invoice',
	description: 'Creates an invoice for a customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an invoice for a customer with one or more line items; it is saved as a draft unless Send is Yes, which emails it to the customer. Use List Contacts for the customer ID and List Items for item IDs. Not idempotent: each call creates a new invoice.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		customerId: zohoInvoiceAiProps.contactId({
			required: true,
			displayName: 'Customer ID',
			description: 'Customer the invoice is for. Use List Contacts to find it.',
		}),
		date: Property.ShortText({
			displayName: 'Invoice Date',
			description: 'Invoice date (yyyy-mm-dd).',
			required: true,
		}),
		lineItems: Property.Array({
			displayName: 'Line Items',
			description: 'Products or services billed on the invoice. At least one.',
			required: true,
			properties: {
				itemId: Property.ShortText({
					displayName: 'Item ID',
					description: 'Item ID. Use List Items to find it.',
					required: false,
				}),
				name: Property.ShortText({
					displayName: 'Name',
					description: 'Line item name. Empty = the item name.',
					required: false,
				}),
				description: Property.LongText({
					displayName: 'Description',
					description: 'Line item description.',
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
				taxId: Property.ShortText({
					displayName: 'Tax ID',
					description: 'Tax applied to this line. Use List Taxes to find it.',
					required: false,
				}),
			},
		}),
		dueDate: Property.ShortText({
			displayName: 'Due Date',
			description: 'Payment due date (yyyy-mm-dd). Empty = derived from the payment terms.',
			required: false,
		}),
		paymentTerms: Property.Number({
			displayName: 'Payment Terms (Days)',
			description: 'Number of days until payment is due.',
			required: false,
		}),
		invoiceNumber: Property.ShortText({
			displayName: 'Invoice Number',
			description:
				'Custom invoice number. Needs Ignore Auto Number Generation = Yes when auto numbering is on.',
			required: false,
		}),
		ignoreAutoNumberGeneration: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Ignore Auto Number Generation',
			description: 'Yes to use the Invoice Number given above instead of the next auto number.',
		}),
		referenceNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'Reference or purchase order number.',
			required: false,
		}),
		discount: Property.Number({
			displayName: 'Discount',
			description: 'Discount applied to the invoice.',
			required: false,
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'Notes shown to the customer on the invoice.',
			required: false,
		}),
		terms: Property.LongText({
			displayName: 'Terms & Conditions',
			description: 'Terms and conditions shown on the invoice.',
			required: false,
		}),
		send: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Send',
			description:
				'Yes to email the invoice to the customer right after creating it (sends a real email). Empty = save as draft.',
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createInvoice({
			auth,
			organizationId: propsValue.organizationId,
			send: zohoInvoiceUtils.toOptionalBoolean({ value: propsValue.send }),
			ignoreAutoNumberGeneration: zohoInvoiceUtils.toOptionalBoolean({
				value: propsValue.ignoreAutoNumberGeneration,
			}),
			body: {
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					customer_id: propsValue.customerId,
					date: propsValue.date,
					line_items: zohoInvoiceUtils.toLineItems({ rows: propsValue.lineItems }),
					due_date: propsValue.dueDate,
					payment_terms: propsValue.paymentTerms,
					invoice_number: propsValue.invoiceNumber,
					reference_number: propsValue.referenceNumber,
					discount: propsValue.discount,
					notes: propsValue.notes,
					terms: propsValue.terms,
				}),
			},
		});
	},
});
