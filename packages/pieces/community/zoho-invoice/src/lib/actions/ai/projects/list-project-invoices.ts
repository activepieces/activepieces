import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListProjectInvoicesOutputSchema } from '../../../output-schemas';

export const listProjectInvoicesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_project_invoices',
	outputSchema: zohoInvoiceListProjectInvoicesOutputSchema,
	displayName: 'List Project Invoices',
	description: 'Lists the invoices raised for a project.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the invoices raised for one project with invoice_id, number, date, total and balance, one page at a time. Use List Projects to find the project ID; use List Invoices for invoices across all projects.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
		sortColumn: zohoInvoiceAiProps.sortColumn({
			required: false,
			description: 'Field to sort by: invoice_number, date, total, balance or created_time.',
		}),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listProjectInvoices({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
			sortColumn: propsValue.sortColumn,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
