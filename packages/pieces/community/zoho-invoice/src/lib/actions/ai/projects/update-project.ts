import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceProjectOutputSchema } from '../../../output-schemas';

export const updateProjectAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_project',
	outputSchema: zohoInvoiceProjectOutputSchema,
	displayName: 'Update Project',
	description: "Changes a project's name, customer, billing method or budget.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes a project's name, customer, description, billing method, rate or budget. Fields left empty keep their current value. Use List Projects to find the ID; use Create Task to add tasks.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
		projectName: Property.ShortText({
			displayName: 'Project Name',
			description: 'New project name (max 100 characters). Empty = unchanged.',
			required: false,
		}),
		customerId: zohoInvoiceAiProps.contactId({
			required: false,
			description: 'New customer ID. Use List Contacts to find it. Empty = unchanged.',
		}),
		billingType: Property.StaticDropdown({
			displayName: 'Billing Method',
			description: 'New billing method. Empty = unchanged.',
			required: false,
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
			required: false,
			description:
				'ID of a user on the project. Use List Project Users to find it. Empty = the first current project user.',
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'New project description. Empty = unchanged.',
			required: false,
		}),
		rate: Property.Number({
			displayName: 'Rate',
			description:
				'Total project cost for "Fixed cost for project", or the hourly rate for "Based on project hours". Empty = unchanged.',
			required: false,
		}),
		budgetType: Property.StaticDropdown({
			displayName: 'Budget Type',
			description: 'New budget type. Empty = unchanged.',
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
			description: 'Planned hours, for the "Total project hours" budget type. Empty = unchanged.',
			required: false,
		}),
		budgetAmount: Property.Number({
			displayName: 'Budget Amount',
			description:
				'Planned budget amount, for the "Total project cost" budget type. Empty = unchanged.',
			required: false,
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		const { organizationId, projectId } = propsValue;
		const current = await zohoInvoiceApi.getProject({ auth, organizationId, projectId });
		return await zohoInvoiceApi.updateProject({
			auth,
			organizationId,
			projectId,
			body: {
				...zohoInvoiceUtils.compact({
					project_name: current.project?.project_name,
					customer_id: current.project?.customer_id,
					billing_type: current.project?.billing_type,
					user_id: current.project?.users?.[0]?.user_id,
					description: current.project?.description,
					rate: current.project?.rate,
					budget_type: current.project?.budget_type,
				}),
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					project_name: propsValue.projectName,
					customer_id: propsValue.customerId,
					billing_type: propsValue.billingType,
					user_id: propsValue.userId,
					description: propsValue.description,
					rate: propsValue.rate,
					budget_type: propsValue.budgetType,
					budget_hours: propsValue.budgetHours,
					budget_amount: propsValue.budgetAmount,
				}),
			},
		});
	},
});
