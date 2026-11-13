import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetDepartmentOutputSchema } from '../../../output-schemas';

export const getDepartmentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_department',
	outputSchema: quickbooksSandboxGetDepartmentOutputSchema,
	displayName: 'Get Department',
	description: 'Gets one department by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one department (a location in QuickBooks) with its parent, full name and SyncToken. Needs QuickBooks Online Plus or Advanced with location tracking on. Get the id from List Departments or Create Department.',
		idempotent: true,
	},
	props: {
		departmentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Department ID',
			description: 'QuickBooks department id. Use List Departments to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Department',
			id: context.propsValue.departmentId,
		});
	},
});
