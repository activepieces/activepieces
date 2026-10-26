import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListProjectsOutputSchema } from '../../../output-schemas';

export const listProjectsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_projects',
	outputSchema: zohoInvoiceListProjectsOutputSchema,
	displayName: 'List Projects',
	description: 'Lists the projects of a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists projects with project_id, name, customer, billing method and status, one page at a time. Filter by status or customer. Use it to find the project ID other project, task and time entry actions need.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		filterBy: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only projects with this status. Empty = all projects.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'Status.All' },
					{ label: 'Active', value: 'Status.Active' },
					{ label: 'Inactive', value: 'Status.Inactive' },
				],
			},
		}),
		customerId: zohoInvoiceAiProps.contactId({
			required: false,
			description: 'Only projects of this customer. Use List Contacts to find it.',
		}),
		sortColumn: zohoInvoiceAiProps.sortColumn({
			required: false,
			description: 'Field to sort by: project_name, customer_name, rate or created_time.',
		}),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listProjects({
			auth,
			organizationId: propsValue.organizationId,
			filterBy: propsValue.filterBy,
			customerId: propsValue.customerId,
			sortColumn: propsValue.sortColumn,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
