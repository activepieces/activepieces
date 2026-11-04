import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxGetDepartmentOutputSchema } from '../../../output-schemas';

export const updateDepartmentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_department',
	outputSchema: quickbooksSandboxGetDepartmentOutputSchema,
	displayName: 'Update Department',
	description: 'Changes fields of an existing department.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one department (a location in QuickBooks): it reads the current department and sends it back with your changes, so unset fields keep their values. Departments cannot be deleted; set Active to No to deactivate one. Needs QuickBooks Online Plus or Advanced with location tracking on. Get the id from List Departments.',
		idempotent: true,
	},
	props: {
		departmentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Department ID',
			description: 'QuickBooks department id. Use List Departments to find it.',
		}),
		name: Property.ShortText({ displayName: 'Name', description: 'New department name, unique among departments.', required: false }),
		parentDepartmentId: quickbooksAiProps.id({
			required: false,
			displayName: 'Parent Department ID',
			description: 'Moves this department under the given parent department. Use List Departments to find it.',
		}),
		active: quickbooksAiProps.flag({
			required: false,
			displayName: 'Active',
			description: 'No deactivates the department (the way to remove it); Yes reactivates it.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { departmentId, name, parentDepartmentId, active, additionalFields } = context.propsValue;
		const fields = quickbooksUtils.requireChanges({
			fields: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						Name: name,
						SubDepartment: parentDepartmentId ? true : undefined,
						ParentRef: quickbooksUtils.ref({ value: parentDepartmentId }),
						Active: active ? active === 'true' : undefined,
					},
				}),
			},
		});
		return await quickbooksApi.replaceEntity({ auth: context.auth, entity: 'Department', id: departmentId, fields });
	},
});
