import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceRecurringInvoiceOutputSchema } from '../../../output-schemas';

import type { ZohoInvoiceDocumentLineItem } from '../../../common/api/recurring-invoices';

export const updateRecurringInvoiceAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_recurring_invoice',
	outputSchema: zohoInvoiceRecurringInvoiceOutputSchema,
	displayName: 'Update Recurring Invoice',
	description: 'Changes a recurring invoice profile.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes a recurring invoice profile: name, customer, schedule, reference or line items. Fields left empty keep their current value; Line Items, when given, replace all current lines (pass Line Item ID to keep an existing line). Use List Recurring Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		recurringInvoiceId: zohoInvoiceAiProps.recurringInvoiceId({ required: true }),
		recurrenceName: Property.ShortText({
			displayName: 'Profile Name',
			description: 'New profile name. Empty = unchanged.',
			required: false,
		}),
		customerId: zohoInvoiceAiProps.contactId({
			required: false,
			displayName: 'Customer ID',
			description: 'New customer contact ID. Use List Contacts to find it. Empty = unchanged.',
		}),
		recurrenceFrequency: Property.StaticDropdown({
			displayName: 'Frequency',
			description: 'New unit of the interval between generated invoices. Empty = unchanged.',
			required: false,
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
			description: 'New number of frequency units between invoices. Empty = unchanged.',
			required: false,
		}),
		startDate: Property.ShortText({
			displayName: 'Start Date',
			description: 'New start date, as yyyy-mm-dd. Empty = unchanged.',
			required: false,
		}),
		endDate: Property.ShortText({
			displayName: 'End Date',
			description: 'New end date, as yyyy-mm-dd. Empty = unchanged.',
			required: false,
		}),
		referenceNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'New reference number. Empty = unchanged.',
			required: false,
		}),
		lineItems: Property.Array({
			displayName: 'Line Items',
			description:
				'Full new list of lines; replaces the current ones. Include Line Item ID (from Get Recurring Invoice) to update an existing line. Empty = lines unchanged.',
			required: false,
			properties: {
				lineItemId: Property.ShortText({
					displayName: 'Line Item ID',
					description:
						'ID of an existing line to update. Use Get Recurring Invoice to find it. Empty = new line.',
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
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		const { organizationId, recurringInvoiceId } = propsValue;
		const current = await zohoInvoiceApi.getRecurringInvoice({
			auth,
			organizationId,
			recurringInvoiceId,
		});
		const profile = current.recurring_invoice;
		return await zohoInvoiceApi.updateRecurringInvoice({
			auth,
			organizationId,
			recurringInvoiceId,
			body: {
				...zohoInvoiceUtils.compact({
					recurrence_name: profile?.recurrence_name,
					customer_id: profile?.customer_id,
					recurrence_frequency: profile?.recurrence_frequency,
					repeat_every: profile?.repeat_every,
					line_items: toCurrentLineItems({ lines: profile?.line_items }),
				}),
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
