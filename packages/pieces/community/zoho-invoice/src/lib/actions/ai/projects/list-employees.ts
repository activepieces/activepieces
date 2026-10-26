import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListEmployeesOutputSchema } from '../../../output-schemas';

export const listEmployeesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_employees',
	outputSchema: zohoInvoiceListEmployeesOutputSchema,
	displayName: 'List Employees',
	description: 'Lists the employees of a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the employees of an organization with employee_id, name and email, one page at a time. Employees are expense payers, not login users; use List Users for those.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listEmployees({
			auth,
			organizationId: propsValue.organizationId,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
