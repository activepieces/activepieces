import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceCreateSpaceOutputSchema } from '../../output-schemas';

export const createSpaceAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_create_space',
	outputSchema: confluenceCreateSpaceOutputSchema,
	displayName: 'Create Space',
	description: 'Creates a space, public or private.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a Confluence space with a name and optional key and description; Private makes it visible only to you. Needs the create-space permission. Not idempotent: a second call with the same key fails because keys are unique.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		key: Property.ShortText({
			displayName: 'Key',
			description:
				'Unique space key, uppercase letters and digits, e.g. "ENG". Generated from the name if empty.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Plain-text description.',
			required: false,
		}),
		isPrivate: Property.Checkbox({
			displayName: 'Private',
			description: 'Create a private space visible only to you.',
			required: false,
		}),
	},
	async run(context) {
		const { name, key, description, isPrivate } = context.propsValue;
		return await confluenceApi.createSpace({
			auth: context.auth,
			name,
			key,
			description,
			isPrivate,
		});
	},
});
