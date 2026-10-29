import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceCreateSpacePropertyOutputSchema } from '../../output-schemas';

export const createSpacePropertyAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_create_space_property',
	outputSchema: confluenceCreateSpacePropertyOutputSchema,
	displayName: 'Create Space Property',
	description: 'Stores a new content property on a space.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Stores a new content property (a key with a JSON value) on a Confluence space. Fails if the key already exists there; use Update Space Property to change it. Not idempotent.',
		idempotent: false,
	},
	props: {
		spaceId: confluenceAiProps.spaceId({ required: true }),
		key: confluenceAiProps.propertyKey({ required: true }),
		value: confluenceAiProps.propertyValue({ required: true }),
	},
	async run(context) {
		const { spaceId, key, value } = context.propsValue;
		return await confluenceApi.createContentProperty({
			auth: context.auth,
			contentType: 'spaces',
			contentId: spaceId,
			key,
			value,
		});
	},
});
