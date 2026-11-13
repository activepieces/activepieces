import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateClassOutputSchema } from '../../../output-schemas';

export const updateClassAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_class',
	outputSchema: quickbooksSandboxCreateClassOutputSchema,
	displayName: 'Update Class',
	description: 'Changes fields of an existing class.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one class: it reads the current class and sends it back with your changes, so unset fields keep their values. Classes cannot be deleted; set Active to No to deactivate one. Needs QuickBooks Online Plus or Advanced with class tracking on. Get the id from List Classes.',
		idempotent: true,
	},
	props: {
		classId: quickbooksAiProps.id({
			required: true,
			displayName: 'Class ID',
			description: 'QuickBooks class id. Use List Classes to find it.',
		}),
		name: Property.ShortText({ displayName: 'Name', description: 'New class name, unique among classes.', required: false }),
		parentClassId: quickbooksAiProps.id({
			required: false,
			displayName: 'Parent Class ID',
			description: 'Moves this class under the given parent class. Use List Classes to find it.',
		}),
		active: quickbooksAiProps.flag({
			required: false,
			displayName: 'Active',
			description: 'No deactivates the class (the way to remove it); Yes reactivates it.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { classId, name, parentClassId, active, additionalFields } = context.propsValue;
		const fields = quickbooksUtils.requireChanges({
			fields: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						Name: name,
						SubClass: parentClassId ? true : undefined,
						ParentRef: quickbooksUtils.ref({ value: parentClassId }),
						Active: active ? active === 'true' : undefined,
					},
				}),
			},
		});
		return await quickbooksApi.replaceEntity({ auth: context.auth, entity: 'Class', id: classId, fields });
	},
});
