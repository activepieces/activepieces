import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceRecurringInvoiceOutputSchema } from '../../../output-schemas';

export const createRecurringInvoiceAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_recurring_invoice',
	outputSchema: zohoInvoiceRecurringInvoiceOutputSchema,
	displayName: 'Create Recurring Invoice',
	description: 'Creates a recurring invoice profile that generates invoices on a schedule.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a recurring invoice profile for a customer that generates a new invoice every N days, weeks, months or years from the start date. Use List Contacts for the customer ID and List Items for item IDs. Not idempotent: each call creates another profile.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		recurrenceName: Property.ShortText({
			displayName: 'Profile Name',
			description: 'Unique name of the recurring invoice profile.',
			required: true,
		}),
		customerId: zohoInvoiceAiProps.contactId({
			required: true,
			displayName: 'Customer ID',
			description: 'Customer contact ID. Use List Contacts to find it.',
		}),
		recurrenceFrequency: Property.StaticDropdown({
			displayName: 'Frequency',
			description: 'Unit of the interval between generated invoices.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Days', value: 'days' },
					{ label: 'Weeks', value: 'weeks' },
					{ label: 'Months', value: 'months' },
					{ label: 'Years', value: 'years' },
				],
			},
		}),
		repeatEvery: Property.Number({
			displayName: 'Repeat Every',
			description:
				'Number of frequency units between invoices, e.g. 2 with Weeks = every 2 weeks. Empty = 1.',
			required: false,
		}),
		startDate: Property.ShortText({
			displayName: 'Start Date',
			description: 'Date of the first invoice, as yyyy-mm-dd. Empty = today.',
			required: false,
		}),
		endDate: Property.ShortText({
			displayName: 'End Date',
			description:
				'Date after which no more invoices are generated, as yyyy-mm-dd. Empty = never ends.',
			required: false,
		}),
		referenceNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'Reference number such as a purchase order number.',
			required: false,
		}),
		lineItems: Property.Array({
			displayName: 'Line Items',
			description:
				'Lines of each generated invoice. Give an Item ID, or a Name and Rate for an ad-hoc line.',
			required: true,
			properties: {
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
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createRecurringInvoice({
			auth,
			organizationId: propsValue.organizationId,
			body: {
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					recurrence_name: propsValue.recurrenceName,
					customer_id: propsValue.customerId,
					recurrence_frequency: propsValue.recurrenceFrequency,
					repeat_every: propsValue.repeatEvery,
					start_date: propsValue.startDate,
					end_date: propsValue.endDate,
					reference_number: propsValue.referenceNumber,
					line_items: zohoInvoiceUtils.toLineItems({ rows: propsValue.lineItems }),
				}),
			},
		});
	},
});
