import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceTaskOutputSchema } from '../../../output-schemas';

export const getTaskAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_task',
	outputSchema: zohoInvoiceTaskOutputSchema,
	displayName: 'Get Task',
	description: 'Gets one task of a project.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one project task by ID with its name, description, rate and status. Use List Projects for the project ID and List Tasks for the task ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
		taskId: zohoInvoiceAiProps.taskId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getProjectTask({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
			taskId: propsValue.taskId,
		});
	},
});
