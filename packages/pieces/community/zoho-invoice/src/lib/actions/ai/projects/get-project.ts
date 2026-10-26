import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceGetProjectOutputSchema } from '../../../output-schemas';

export const getProjectAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_project',
	outputSchema: zohoInvoiceGetProjectOutputSchema,
	displayName: 'Get Project',
	description: 'Gets one project from Zoho Invoice.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one project by ID with its customer, billing method, budget, tasks and logged hours and amounts. Use List Projects to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getProject({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
		});
	},
});
