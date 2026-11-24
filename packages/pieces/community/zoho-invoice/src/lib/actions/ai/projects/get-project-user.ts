import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceGetProjectUserOutputSchema } from '../../../output-schemas';

export const getProjectUserAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_project_user',
	outputSchema: zohoInvoiceGetProjectUserOutputSchema,
	displayName: 'Get Project User',
	description: 'Gets one user assigned to a project.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one project user by ID with their role, rate, budget and logged hours on that project. Use List Projects for the project ID and List Project Users for the user ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
		userId: zohoInvoiceAiProps.userId({
			required: true,
			description: 'User ID. Use List Project Users to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getProjectUser({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
			userId: propsValue.userId,
		});
	},
});
