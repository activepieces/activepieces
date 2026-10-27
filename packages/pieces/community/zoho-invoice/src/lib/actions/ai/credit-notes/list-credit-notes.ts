import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListCreditNotesOutputSchema } from '../../../output-schemas';

export const listCreditNotesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_credit_notes',
	outputSchema: zohoInvoiceListCreditNotesOutputSchema,
	displayName: 'List Credit Notes',
	description: 'Lists credit notes, one page at a time.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists credit notes with creditnote_id, number, customer, status, total and balance, one page at a time. Filter by status, customer or date, or search by number, customer name or reference.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		filterBy: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only credit notes with this status. Empty = all.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'Status.All' },
					{ label: 'Open', value: 'Status.Open' },
					{ label: 'Draft', value: 'Status.Draft' },
					{ label: 'Closed', value: 'Status.Closed' },
					{ label: 'Void', value: 'Status.Void' },
				],
			},
		}),
		customerId: zohoInvoiceAiProps.contactId({ required: false, displayName: 'Customer ID' }),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'Only credit notes dated this day, yyyy-mm-dd.',
			required: false,
		}),
		searchText: zohoInvoiceAiProps.searchText({
			required: false,
			description: 'Search by credit note number, customer name or reference number.',
		}),
		sortColumn: zohoInvoiceAiProps.sortColumn({
			required: false,
			description:
				'Field to sort by: customer_name, creditnote_number, balance, total, date or created_time.',
		}),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listCreditNotes({
			auth,
			organizationId: propsValue.organizationId,
			filterBy: propsValue.filterBy,
			customerId: propsValue.customerId,
			date: propsValue.date,
			searchText: propsValue.searchText,
			sortColumn: propsValue.sortColumn,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
