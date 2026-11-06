import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceEstimateOutputSchema } from '../../../output-schemas';

export const createEstimateAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_estimate',
	outputSchema: zohoInvoiceEstimateOutputSchema,
	displayName: 'Create Estimate',
	description: 'Creates a draft estimate (quote) for a customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a draft estimate for a customer; it is not emailed (use Email Estimate for that). Use List Contacts for the customer ID and List Items for item IDs. Not idempotent: each call creates another estimate.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		customerId: zohoInvoiceAiProps.contactId({
			required: true,
			displayName: 'Customer ID',
			description: 'Customer contact ID. Use List Contacts to find it.',
		}),
		lineItems: Property.Array({
			displayName: 'Line Items',
			description: 'Lines of the estimate.',
			required: true,
			properties: {
				itemId: Property.ShortText({
					displayName: 'Item ID',
					description: 'Item ID. Use List Items to find it.',
					required: true,
				}),
				name: Property.ShortText({ displayName: 'Name', required: false }),
				description: Property.LongText({ displayName: 'Description', required: false }),
				rate: Property.Number({ displayName: 'Rate', required: true }),
				quantity: Property.Number({ displayName: 'Quantity', required: true }),
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
			description: 'Custom estimate number. Empty = the next auto-generated number.',
			required: false,
		}),
		referenceNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'Reference number such as a purchase order number.',
			required: false,
		}),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'Estimate date, as yyyy-mm-dd. Empty = today.',
			required: false,
		}),
		expiryDate: Property.ShortText({
			displayName: 'Expiry Date',
			description: 'Date the estimate expires, as yyyy-mm-dd.',
			required: false,
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'Notes shown to the customer.',
			required: false,
		}),
		terms: Property.LongText({
			displayName: 'Terms',
			description: 'Terms and conditions shown on the estimate.',
			required: false,
		}),
		templateId: zohoInvoiceAiProps.templateId({
			required: false,
			description:
				'PDF template ID. Use List Estimate Templates to find it. Empty = the default template.',
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createEstimate({
			auth,
			organizationId: propsValue.organizationId,
			ignoreAutoNumberGeneration: propsValue.estimateNumber === undefined ? undefined : true,
			body: {
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
					template_id: propsValue.templateId,
				}),
			},
		});
	},
});
