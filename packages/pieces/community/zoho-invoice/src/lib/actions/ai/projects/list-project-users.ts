import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListProjectUsersOutputSchema } from '../../../output-schemas';

export const listProjectUsersAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_project_users',
	outputSchema: zohoInvoiceListProjectUsersOutputSchema,
	displayName: 'List Project Users',
	description: 'Lists the users assigned to a project.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the users assigned to one project with user_id, name, role, rate and logged hours. Use List Projects to find the project ID; use List Users for every user of the organization.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listProjectUsers({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
		});
	},
});
