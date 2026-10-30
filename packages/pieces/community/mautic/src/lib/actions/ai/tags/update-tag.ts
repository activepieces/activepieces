import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateTagOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateTagAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_tag',
	outputSchema: mauticCreateTagOutputSchema,
	displayName: 'Update Tag',
	description: 'Updates fields of a Mautic tag.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates an existing tag, e.g. to rename it. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Tag Id',
			description: 'Numeric tag id, from List Tags or Create Tag.',
		}),
		tag: Property.ShortText({ displayName: 'Tag', description: 'Tag name.', required: false }),
	},
	async run(context) {
		const { id, tag } = context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'tags',
			id,
			body: {
				...spreadIfDefined('tag', tag),
			},
		});
	},
});
