import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceCloneProjectOutputSchema } from '../../../output-schemas';

export const cloneProjectAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_clone_project',
	outputSchema: zohoInvoiceCloneProjectOutputSchema,
	displayName: 'Clone Project',
	description: 'Creates a copy of a project under a new name.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a new project copied from an existing one (customer, billing, tasks and users) under a new name. Use List Projects to find the ID. Not idempotent: each call creates another project.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({
			required: true,
			description: 'ID of the project to copy. Use List Projects to find it.',
		}),
		projectName: Property.ShortText({
			displayName: 'Project Name',
			description: 'Name of the new project (max 100 characters).',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Description of the new project.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.cloneProject({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
			body: zohoInvoiceUtils.compact({
				project_name: propsValue.projectName,
				description: propsValue.description,
			}),
		});
	},
});
