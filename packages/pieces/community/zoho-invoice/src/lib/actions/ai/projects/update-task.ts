import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceTaskOutputSchema } from '../../../output-schemas';

export const updateTaskAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_task',
	outputSchema: zohoInvoiceTaskOutputSchema,
	displayName: 'Update Task',
	description: "Changes a project task's name, description, rate or budget hours.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes a project task's name, description, rate or budget hours. Fields left empty keep their current value. Use List Projects for the project ID and List Tasks for the task ID.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
		taskId: zohoInvoiceAiProps.taskId({ required: true }),
		taskName: Property.ShortText({
			displayName: 'Task Name',
			description: 'New task name. Empty = unchanged.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'New task description. Empty = unchanged.',
			required: false,
		}),
		rate: Property.Number({
			displayName: 'Rate',
			description: 'New hourly rate. Empty = unchanged.',
			required: false,
		}),
		budgetHours: Property.Number({
			displayName: 'Budget Hours',
			description: 'New planned hours. Empty = unchanged.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const { organizationId, projectId, taskId } = propsValue;
		const current = await zohoInvoiceApi.getProjectTask({
			auth,
			organizationId,
			projectId,
			taskId,
		});
		return await zohoInvoiceApi.updateProjectTask({
			auth,
			organizationId,
			projectId,
			taskId,
			body: zohoInvoiceUtils.compact({
				task_name: propsValue.taskName ?? current.task?.task_name,
				description: propsValue.description ?? current.task?.description,
				rate: propsValue.rate ?? current.task?.rate,
				budget_hours: propsValue.budgetHours,
			}),
		});
	},
});
