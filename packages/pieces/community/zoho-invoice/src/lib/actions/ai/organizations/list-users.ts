import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListUsersOutputSchema } from '../../../output-schemas';

export const listUsersAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_users',
	outputSchema: zohoInvoiceListUsersOutputSchema,
	displayName: 'List Users',
	description: 'Lists the users of a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the users of an organization with user_id, name, email, role and status, one page at a time. Filter by status. Needs the Admin role.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		filterBy: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only users with this status. Empty = all users.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'Status.All' },
					{ label: 'Active', value: 'Status.Active' },
					{ label: 'Inactive', value: 'Status.Inactive' },
					{ label: 'Invited', value: 'Status.Invited' },
					{ label: 'Deleted', value: 'Status.Deleted' },
				],
			},
		}),
		sortColumn: zohoInvoiceAiProps.sortColumn({
			required: false,
			description: 'Field to sort by: name, email, user_role or status.',
		}),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listUsers({
			auth,
			organizationId: propsValue.organizationId,
			filterBy: propsValue.filterBy,
			sortColumn: propsValue.sortColumn,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
