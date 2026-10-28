import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListContactsOutputSchema } from '../../../output-schemas';

export const listContactsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_contacts',
	outputSchema: zohoInvoiceListContactsOutputSchema,
	displayName: 'List Contacts',
	description: 'Lists or searches the customer contacts of a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists customer contacts with contact_id, name, company, email and outstanding amounts, one page at a time. Filter by status, name, company, email or phone, or search by name and notes. Use it to find the contact_id other actions need.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		filterBy: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only contacts with this status. Empty = all contacts.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'Status.All' },
					{ label: 'Active', value: 'Status.Active' },
					{ label: 'Inactive', value: 'Status.Inactive' },
					{ label: 'Duplicate', value: 'Status.Duplicate' },
					{ label: 'CRM', value: 'Status.Crm' },
				],
			},
		}),
		searchText: zohoInvoiceAiProps.searchText({
			required: false,
			description: 'Free-text search across contact name and notes.',
		}),
		contactName: Property.ShortText({
			displayName: 'Contact Name',
			description: 'Only contacts with this name.',
			required: false,
		}),
		companyName: Property.ShortText({
			displayName: 'Company Name',
			description: 'Only contacts with this company name.',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Only contacts with a contact person with this email.',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'Only contacts with a contact person with this phone number.',
			required: false,
		}),
		sortColumn: zohoInvoiceAiProps.sortColumn({
			required: false,
			description:
				'Field to sort by: contact_name, first_name, last_name, email, outstanding_receivable_amount, created_time or last_modified_time.',
		}),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listContacts({
			auth,
			organizationId: propsValue.organizationId,
			contactName: propsValue.contactName,
			companyName: propsValue.companyName,
			email: propsValue.email,
			phone: propsValue.phone,
			filterBy: propsValue.filterBy,
			searchText: propsValue.searchText,
			sortColumn: propsValue.sortColumn,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
