import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreatePointGroupOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreatePointGroupAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_point_group',
	outputSchema: mauticCreatePointGroupOutputSchema,
	displayName: 'Create Point Group',
	description: 'Creates a Mautic point group.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Creates a point group. Name is required. Adjust a contact's score in it with Adjust Contact Group Points. Needs Mautic 5.1 or later.",
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		isPublished: mauticAiProps.yesNo({ displayName: 'Published' }),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other point group properties. The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const { additionalFields, name, description, isPublished } = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'points/groups',
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('description', description),
				...spreadIfDefined('isPublished', isPublished),
			},
		});
	},
});
