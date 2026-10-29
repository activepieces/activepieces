import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const activateProjectAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_activate_project',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Activate Project',
	description: 'Marks a project as active.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Marks a project as active so time can be logged against it again. Use List Projects to find the ID. Repeating it leaves the project active.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.activateProject({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
		});
	},
});
