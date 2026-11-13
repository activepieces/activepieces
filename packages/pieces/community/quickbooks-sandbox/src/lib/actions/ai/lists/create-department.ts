import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateDepartmentOutputSchema } from '../../../output-schemas';

export const createDepartmentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_department',
	outputSchema: quickbooksSandboxCreateDepartmentOutputSchema,
	displayName: 'Create Department',
	description: 'Creates a department (a location in QuickBooks).',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a department, shown as a location in QuickBooks, for tagging whole transactions via DepartmentRef. Needs QuickBooks Online Plus or Advanced with location tracking on; for a sub-department pass the parent id from List Departments. Not idempotent: each call creates a new department, and a duplicate name is rejected.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Department name, unique among departments.',
			required: true,
		}),
		parentDepartmentId: quickbooksAiProps.id({
			required: false,
			displayName: 'Parent Department ID',
			description: 'Makes this a sub-department of the given department. Use List Departments to find it.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { name, parentDepartmentId, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Department',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						Name: name,
						SubDepartment: parentDepartmentId ? true : undefined,
						ParentRef: quickbooksUtils.ref({ value: parentDepartmentId }),
					},
				}),
			},
		});
	},
});
