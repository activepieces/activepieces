import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceProjectOutputSchema } from '../../../output-schemas';

export const createProjectAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_project',
	outputSchema: zohoInvoiceProjectOutputSchema,
	displayName: 'Create Project',
	description: 'Creates a project for a customer in Zoho Invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a project for a customer, with its billing method, budget, tasks and the first assigned user. Use List Contacts for the customer ID and List Users for the user ID. Not idempotent: each call creates a new project. May need the Projects module enabled in Preferences.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectName: Property.ShortText({
			displayName: 'Project Name',
			description: 'Name of the project (max 100 characters).',
			required: true,
		}),
		customerId: zohoInvoiceAiProps.contactId({ required: true }),
		billingType: Property.StaticDropdown({
			displayName: 'Billing Method',
			description: 'How the customer is billed for this project.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Fixed cost for project', value: 'fixed_cost_for_project' },
					{ label: 'Based on project hours', value: 'based_on_project_hours' },
					{ label: 'Based on staff hours', value: 'based_on_staff_hours' },
					{ label: 'Based on task hours', value: 'based_on_task_hours' },
				],
			},
		}),
		userId: zohoInvoiceAiProps.userId({
			required: true,
			description: 'ID of the user to add to the project. Use List Users to find it.',
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Project description.',
			required: false,
		}),
		rate: Property.Number({
			displayName: 'Rate',
			description:
				'Total project cost for "Fixed cost for project", or the hourly rate for "Based on project hours".',
			required: false,
		}),
		budgetType: Property.StaticDropdown({
			displayName: 'Budget Type',
			description: 'How the project is budgeted. Empty = no budget.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Total project cost', value: 'total_project_cost' },
					{ label: 'Total project hours', value: 'total_project_hours' },
					{ label: 'Hours per task', value: 'hours_per_task' },
					{ label: 'Hours per staff', value: 'hours_per_staff' },
				],
			},
		}),
		budgetHours: Property.Number({
			displayName: 'Budget Hours',
			description: 'Planned hours, for the "Total project hours" budget type.',
			required: false,
		}),
		budgetAmount: Property.Number({
			displayName: 'Budget Amount',
			description: 'Planned budget amount, for the "Total project cost" budget type.',
			required: false,
		}),
		tasks: Property.Array({
			displayName: 'Tasks',
			description: 'Tasks to create in the project.',
			required: false,
			properties: {
				taskName: Property.ShortText({
					displayName: 'Task Name',
					description: 'Name of the task.',
					required: true,
				}),
				description: Property.ShortText({
					displayName: 'Description',
					description: 'Task description.',
					required: false,
				}),
				rate: Property.Number({
					displayName: 'Rate',
					description: 'Hourly rate, for "Based on task hours" billing.',
					required: false,
				}),
				budgetHours: Property.Number({
					displayName: 'Budget Hours',
					description: 'Planned hours for the task.',
					required: false,
				}),
			},
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createProject({
			auth,
			organizationId: propsValue.organizationId,
			body: {
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					project_name: propsValue.projectName,
					customer_id: propsValue.customerId,
					billing_type: propsValue.billingType,
					user_id: propsValue.userId,
					users: [{ user_id: propsValue.userId }],
					description: propsValue.description,
					rate: propsValue.rate,
					budget_type: propsValue.budgetType,
					budget_hours: propsValue.budgetHours,
					budget_amount: propsValue.budgetAmount,
					tasks:
						propsValue.tasks &&
						zohoInvoiceUtils
							.toRecords({ rows: propsValue.tasks, propName: 'Tasks' })
							.map((value) => toTaskBody({ value })),
				}),
			},
		});
	},
});

function toTaskBody({ value }: { value: Record<string, unknown> }): Record<string, unknown> {
	return zohoInvoiceUtils.compact({
		task_name: value['taskName'],
		description: value['description'],
		rate: value['rate'],
		budget_hours: value['budgetHours'],
	});
}
