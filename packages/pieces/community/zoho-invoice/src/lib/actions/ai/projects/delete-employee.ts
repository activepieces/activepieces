import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteEmployeeAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_employee',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Employee',
	description: 'Deletes an employee from a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes an employee record. Use List Employees to find the ID. Needs the Admin role. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		employeeId: zohoInvoiceAiProps.idProp({
			required: true,
			displayName: 'Employee ID',
			description: 'Employee ID. Use List Employees to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteEmployee({
			auth,
			organizationId: propsValue.organizationId,
			employeeId: propsValue.employeeId,
		});
	},
});
