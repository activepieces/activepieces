import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListInvoicesOutputSchema } from '../../../output-schemas';

export const listInvoicesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_invoices',
	outputSchema: zohoInvoiceListInvoicesOutputSchema,
	displayName: 'List Invoices',
	description: 'Lists and searches the invoices of an organization.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists invoices with invoice_id, number, customer, status, dates, total and balance, one page at a time. Filter by status, customer, invoice number, date range or free text. Use List Contacts to find the customer ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only invoices with this status. Empty = all statuses.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Sent', value: 'sent' },
					{ label: 'Draft', value: 'draft' },
					{ label: 'Overdue', value: 'overdue' },
					{ label: 'Paid', value: 'paid' },
					{ label: 'Void', value: 'void' },
					{ label: 'Unpaid', value: 'unpaid' },
					{ label: 'Partially Paid', value: 'partially_paid' },
					{ label: 'Viewed', value: 'viewed' },
				],
			},
		}),
		customerId: zohoInvoiceAiProps.contactId({
			required: false,
			displayName: 'Customer ID',
			description: 'Only invoices of this customer. Use List Contacts to find it.',
		}),
		searchText: zohoInvoiceAiProps.searchText({
			required: false,
			description: 'Matches invoice number, purchase order or customer name (max 100 characters).',
		}),
		invoiceNumber: Property.ShortText({
			displayName: 'Invoice Number',
			description: 'Exact invoice number, e.g. "INV-00003".',
			required: false,
		}),
		dateStart: Property.ShortText({
			displayName: 'Date From',
			description: 'Only invoices dated on or after this day (yyyy-mm-dd).',
			required: false,
		}),
		dateEnd: Property.ShortText({
			displayName: 'Date To',
			description: 'Only invoices dated on or before this day (yyyy-mm-dd).',
			required: false,
		}),
		sortColumn: Property.StaticDropdown({
			displayName: 'Sort Column',
			description: 'Field to sort by. Empty = the vendor default.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Customer Name', value: 'customer_name' },
					{ label: 'Invoice Number', value: 'invoice_number' },
					{ label: 'Date', value: 'date' },
					{ label: 'Due Date', value: 'due_date' },
					{ label: 'Total', value: 'total' },
					{ label: 'Balance', value: 'balance' },
					{ label: 'Created Time', value: 'created_time' },
				],
			},
		}),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.searchInvoices({
			auth,
			organizationId: propsValue.organizationId,
			status: propsValue.status,
			customerId: propsValue.customerId,
			searchText: propsValue.searchText,
			invoiceNumber: propsValue.invoiceNumber,
			dateStart: propsValue.dateStart,
			dateEnd: propsValue.dateEnd,
			sortColumn: propsValue.sortColumn,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
