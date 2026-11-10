import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceGetSpaceOutputSchema } from '../../output-schemas';

export const getSpaceAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_space',
	outputSchema: confluenceGetSpaceOutputSchema,
	displayName: 'Get Space',
	description: 'Gets a space by its numeric ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one Confluence space by its numeric ID, with its key, name, type, status, homepage ID and plain-text description. Use List Spaces with Space Keys to find a space by key.',
		idempotent: true,
	},
	props: {
		spaceId: confluenceAiProps.spaceId({ required: true }),
		includeLabels: Property.Checkbox({ displayName: 'Include Labels', required: false }),
		includeProperties: Property.Checkbox({ displayName: 'Include Properties', required: false }),
	},
	async run(context) {
		const { spaceId, includeLabels, includeProperties } = context.propsValue;
		return await confluenceApi.getContent({
			auth: context.auth,
			contentType: 'spaces',
			contentId: spaceId,
			query: {
				'description-format': 'plain',
				'include-labels': includeLabels || undefined,
				'include-properties': includeProperties || undefined,
			},
		});
	},
});
