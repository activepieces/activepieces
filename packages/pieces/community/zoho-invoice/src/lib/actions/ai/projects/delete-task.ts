import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteTaskAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_task',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Task',
	description: 'Deletes a task from a project.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one task from a project. Use List Projects for the project ID and List Tasks for the task ID. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
		taskId: zohoInvoiceAiProps.taskId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteProjectTask({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
			taskId: propsValue.taskId,
		});
	},
});
