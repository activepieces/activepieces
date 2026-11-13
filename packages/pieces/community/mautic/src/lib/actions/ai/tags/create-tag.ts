import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateTagOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticApi } from '../../../common/api';

export const mauticCreateTagAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_tag',
	outputSchema: mauticCreateTagOutputSchema,
	displayName: 'Create Tag',
	description: 'Creates a Mautic tag.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a tag. Tag is required; the Mautic tag API accepts only the name. To tag a contact, use Update Contact with Tags instead.',
		idempotent: false,
	},
	props: {
		tag: Property.ShortText({ displayName: 'Tag', description: 'Tag name.', required: true }),
	},
	async run(context) {
		const { tag } = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'tags',
			body: {
				...spreadIfDefined('tag', tag),
			},
		});
	},
});
