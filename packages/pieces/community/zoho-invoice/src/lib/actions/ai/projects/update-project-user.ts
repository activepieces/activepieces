import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceGetProjectUserOutputSchema } from '../../../output-schemas';

export const updateProjectUserAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_project_user',
	outputSchema: zohoInvoiceGetProjectUserOutputSchema,
	displayName: 'Update Project User',
	description: "Changes a project user's role, rate or budget hours.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes a user's role, hourly rate or budget hours on one project. Fields left empty are not sent. Use List Projects for the project ID and List Project Users for the user ID.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
		userId: zohoInvoiceAiProps.userId({
			required: true,
			description: 'User ID. Use List Project Users to find it.',
		}),
		userRole: Property.StaticDropdown({
			displayName: 'Role',
			description: 'New role on the project. Empty = unchanged.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Staff', value: 'staff' },
					{ label: 'Admin', value: 'admin' },
					{ label: 'Timesheet staff', value: 'timesheetstaff' },
				],
			},
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
		return await zohoInvoiceApi.updateProjectUser({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
			userId: propsValue.userId,
			body: zohoInvoiceUtils.compact({
				user_role: propsValue.userRole,
				rate: propsValue.rate,
				budget_hours: propsValue.budgetHours,
			}),
		});
	},
});
