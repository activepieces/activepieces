import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceEstimateOutputSchema } from '../../../output-schemas';

import type { ZohoInvoiceDocumentLineItem } from '../../../common/api/recurring-invoices';

export const updateEstimateAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_estimate',
	outputSchema: zohoInvoiceEstimateOutputSchema,
	displayName: 'Update Estimate',
	description: 'Changes an estimate.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes an estimate: customer, lines, number, reference, dates, notes, terms or custom fields (via Additional Fields). Fields left empty keep their current value; Line Items, when given, replace all current lines (pass Line Item ID to keep an existing line). Use List Estimates to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateId: zohoInvoiceAiProps.estimateId({ required: true }),
		customerId: zohoInvoiceAiProps.contactId({
			required: false,
			displayName: 'Customer ID',
			description: 'New customer contact ID. Use List Contacts to find it. Empty = unchanged.',
		}),
		lineItems: Property.Array({
			displayName: 'Line Items',
			description:
				'Full new list of lines; replaces the current ones. Include Line Item ID (from Get Estimate) to update an existing line. Empty = lines unchanged.',
			required: false,
			properties: {
				lineItemId: Property.ShortText({
					displayName: 'Line Item ID',
					description:
						'ID of an existing line to update. Use Get Estimate to find it. Empty = new line.',
					required: false,
				}),
				itemId: Property.ShortText({
					displayName: 'Item ID',
					description: 'Item ID. Use List Items to find it.',
					required: false,
				}),
				name: Property.ShortText({ displayName: 'Name', required: false }),
				description: Property.LongText({ displayName: 'Description', required: false }),
				rate: Property.Number({ displayName: 'Rate', required: false }),
				quantity: Property.Number({ displayName: 'Quantity', required: false }),
				discount: Property.ShortText({
					displayName: 'Discount',
					description: 'Flat amount, or a percentage such as "10%".',
					required: false,
				}),
				taxId: Property.ShortText({
					displayName: 'Tax ID',
					description: 'Tax ID. Use List Taxes to find it.',
					required: false,
				}),
			},
		}),
		estimateNumber: Property.ShortText({
			displayName: 'Estimate Number',
			description: 'New estimate number. Empty = unchanged.',
			required: false,
		}),
		referenceNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'New reference number. Empty = unchanged.',
			required: false,
		}),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'New estimate date, as yyyy-mm-dd. Empty = unchanged.',
			required: false,
		}),
		expiryDate: Property.ShortText({
			displayName: 'Expiry Date',
			description: 'New expiry date, as yyyy-mm-dd. Empty = unchanged.',
			required: false,
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'New notes shown to the customer. Empty = unchanged.',
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
		const { organizationId, estimateId } = propsValue;
		const current = await zohoInvoiceApi.getEstimate({ auth, organizationId, estimateId });
		const estimate = current.estimate;
		return await zohoInvoiceApi.updateEstimate({
			auth,
			organizationId,
			estimateId,
			ignoreAutoNumberGeneration: propsValue.estimateNumber === undefined ? undefined : true,
			body: {
				...zohoInvoiceUtils.compact({
					customer_id: estimate?.customer_id,
					line_items: toCurrentLineItems({ lines: estimate?.line_items }),
				}),
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					customer_id: propsValue.customerId,
					line_items: zohoInvoiceUtils.toLineItems({ rows: propsValue.lineItems }),
					estimate_number: propsValue.estimateNumber,
					reference_number: propsValue.referenceNumber,
					date: propsValue.date,
					expiry_date: propsValue.expiryDate,
					notes: propsValue.notes,
					terms: propsValue.terms,
				}),
			},
		});
	},
});

function toCurrentLineItems({
	lines,
}: {
	lines: ZohoInvoiceDocumentLineItem[] | undefined;
}): Record<string, unknown>[] | undefined {
	return lines?.map((line) =>
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
	);
}
