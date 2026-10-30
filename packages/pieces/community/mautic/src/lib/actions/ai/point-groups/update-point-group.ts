import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetPointGroupOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdatePointGroupAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_point_group',
	outputSchema: mauticGetPointGroupOutputSchema,
	displayName: 'Update Point Group',
	description: 'Updates fields of a Mautic point group.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates an existing point group. Needs Mautic 5.1 or later. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Point Group Id',
			description: 'Numeric point group id, from List Point Groups or Create Point Group.',
		}),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		isPublished: mauticAiProps.yesNo({ displayName: 'Published' }),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other point group properties. The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const { id, additionalFields, name, description, isPublished } = context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'points/groups',
			id,
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('description', description),
				...spreadIfDefined('isPublished', isPublished),
			},
		});
	},
});
