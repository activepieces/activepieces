import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { findOrCreateTag, requireText } from '../common/lookups';
import { tagOutputSchema } from '../output-schemas';

export const createTagAction = createAction({
	auth: intercomAuth,
	name: 'create_tag',
	classification: 'WRITE',
	displayName: 'Create Tag',
	description: 'Creates a tag, or returns the existing tag with that name.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a tag with the given name, or returns the existing tag when one already has that name in any letter case (the existing name is left as it is). Calling it again returns the same tag, so it is safe to retry.',
		idempotent: true,
	},
	props: {
		name: Property.ShortText({ displayName: 'Tag Name', required: true }),
	},
	outputSchema: tagOutputSchema,
	async run(context) {
		const name = requireText({ label: 'Tag Name', value: context.propsValue.name });
		return findOrCreateTag({ auth: context.auth, name });
	},
});
