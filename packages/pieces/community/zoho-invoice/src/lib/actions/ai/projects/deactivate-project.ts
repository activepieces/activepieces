import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deactivateProjectAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_deactivate_project',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Deactivate Project',
	description: 'Marks a project as inactive.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Marks a project as inactive so no new time is logged against it, keeping its history; undo with Activate Project. Use List Projects to find the ID. Repeating it leaves the project inactive.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deactivateProject({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
		});
	},
});
