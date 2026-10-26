import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceTaskOutputSchema } from '../../../output-schemas';

export const createTaskAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_task',
	outputSchema: zohoInvoiceTaskOutputSchema,
	displayName: 'Create Task',
	description: 'Adds a task to a project.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a task to a project; time entries are logged against tasks. Use List Projects to find the project ID. Not idempotent: each call creates another task.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
		taskName: Property.ShortText({
			displayName: 'Task Name',
			description: 'Name of the task.',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Task description.',
			required: false,
		}),
		rate: Property.Number({
			displayName: 'Rate',
			description: 'Hourly rate, used when the project bills based on task hours.',
			required: false,
		}),
		budgetHours: Property.Number({
			displayName: 'Budget Hours',
			description: 'Planned hours for the task.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createProjectTask({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
			body: zohoInvoiceUtils.compact({
				task_name: propsValue.taskName,
				description: propsValue.description,
				rate: propsValue.rate,
				budget_hours: propsValue.budgetHours,
			}),
		});
	},
});
