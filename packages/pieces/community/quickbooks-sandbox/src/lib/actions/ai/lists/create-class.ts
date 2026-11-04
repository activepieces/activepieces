import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateClassOutputSchema } from '../../../output-schemas';

export const createClassAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_class',
	outputSchema: quickbooksSandboxCreateClassOutputSchema,
	displayName: 'Create Class',
	description: 'Creates a class for tracking transactions.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a class, a tag for grouping transactions (e.g. by business segment) set via ClassRef on lines. Needs QuickBooks Online Plus or Advanced with class tracking on; for a sub-class pass the parent id from List Classes. Not idempotent: each call creates a new class, and a duplicate name is rejected.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Class name, unique among classes.',
			required: true,
		}),
		parentClassId: quickbooksAiProps.id({
			required: false,
			displayName: 'Parent Class ID',
			description: 'Makes this a sub-class of the given class. Use List Classes to find it.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { name, parentClassId, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Class',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						Name: name,
						SubClass: parentClassId ? true : undefined,
						ParentRef: quickbooksUtils.ref({ value: parentClassId }),
					},
				}),
			},
		});
	},
});
