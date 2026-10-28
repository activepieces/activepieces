import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteProjectAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_project',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Project',
	description: 'Deletes a project from Zoho Invoice.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a project with its tasks. Use List Projects to find the ID. Prefer Deactivate Project to keep the history. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteProject({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
		});
	},
});
