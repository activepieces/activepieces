import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateEmployeeOutputSchema } from '../../../output-schemas';

export const getEmployeeAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_employee',
	outputSchema: quickbooksSandboxCreateEmployeeOutputSchema,
	displayName: 'Get Employee',
	description: 'Gets one employee by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Reads one employee with its name, contact details, hire date and SyncToken. Get the id from List Employees or Create Employee.',
		idempotent: true,
	},
	props: {
		employeeId: quickbooksAiProps.id({
			required: true,
			displayName: 'Employee ID',
			description: 'QuickBooks employee id. Use List Employees to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Employee',
			id: context.propsValue.employeeId,
		});
	},
});
