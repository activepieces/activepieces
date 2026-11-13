import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceInvoiceOutputSchema } from '../../../output-schemas';

export const updateInvoiceAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_invoice',
	outputSchema: zohoInvoiceInvoiceOutputSchema,
	displayName: 'Update Invoice',
	description: 'Changes the details or line items of an invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes an invoice; fields left empty keep their current value. Line Items, when given, replace the whole list: include line_item_id (from Get Invoice) to keep or edit an existing line, omit it to add a new one, and leave a line out to remove it. Use List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
		customerId: zohoInvoiceAiProps.contactId({
			required: false,
			displayName: 'Customer ID',
			description: 'New customer. Use List Contacts to find it. Empty = unchanged.',
		}),
		lineItems: Property.Array({
			displayName: 'Line Items',
			description:
				'Full new list of line items. Empty = the current line items are kept as they are.',
			required: false,
			properties: {
				lineItemId: Property.ShortText({
					displayName: 'Line Item ID',
					description:
						'ID of the existing line to keep or edit, from Get Invoice. Empty = a new line.',
					required: false,
				}),
				itemId: Property.ShortText({
					displayName: 'Item ID',
					description: 'Item ID. Use List Items to find it.',
					required: false,
				}),
				name: Property.ShortText({
					displayName: 'Name',
					description: 'Line item name.',
					required: false,
				}),
				description: Property.LongText({
					displayName: 'Description',
					description: 'Line item description.',
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
				taxId: Property.ShortText({
					displayName: 'Tax ID',
					description: 'Tax applied to this line. Use List Taxes to find it.',
					required: false,
				}),
			},
		}),
		date: Property.ShortText({
			displayName: 'Invoice Date',
			description: 'New invoice date (yyyy-mm-dd). Empty = unchanged.',
			required: false,
		}),
		dueDate: Property.ShortText({
			displayName: 'Due Date',
			description: 'New due date (yyyy-mm-dd). Empty = unchanged.',
			required: false,
		}),
		paymentTerms: Property.Number({
			displayName: 'Payment Terms (Days)',
			description: 'New number of days until payment is due. Empty = unchanged.',
			required: false,
		}),
		invoiceNumber: Property.ShortText({
			displayName: 'Invoice Number',
			description:
				'New invoice number. Needs Ignore Auto Number Generation = Yes when auto numbering is on. Empty = unchanged.',
			required: false,
		}),
		ignoreAutoNumberGeneration: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Ignore Auto Number Generation',
			description: 'Yes to keep the Invoice Number given above instead of an auto number.',
		}),
		referenceNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'New reference or purchase order number. Empty = unchanged.',
			required: false,
		}),
		discount: Property.Number({
			displayName: 'Discount',
			description: 'New invoice discount. Empty = unchanged.',
			required: false,
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'New customer notes. Empty = unchanged.',
			required: false,
		}),
		terms: Property.LongText({
			displayName: 'Terms & Conditions',
			description: 'New terms and conditions. Empty = unchanged.',
			required: false,
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		const { organizationId, invoiceId } = propsValue;
		const current = await zohoInvoiceApi.getInvoice({ auth, organizationId, invoiceId });
		return await zohoInvoiceApi.updateInvoice({
			auth,
			organizationId,
			invoiceId,
			ignoreAutoNumberGeneration: zohoInvoiceUtils.toOptionalBoolean({
				value: propsValue.ignoreAutoNumberGeneration,
			}),
			body: {
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					customer_id: propsValue.customerId ?? current.invoice?.customer_id,
					line_items:
						propsValue.lineItems === undefined
							? current.invoice?.line_items
							: zohoInvoiceUtils.toLineItems({ rows: propsValue.lineItems }),
					date: propsValue.date,
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
