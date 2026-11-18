import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListSpacePropertiesOutputSchema } from '../../output-schemas';

export const listSpacePropertiesAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_space_properties',
	outputSchema: confluenceListSpacePropertiesOutputSchema,
	displayName: 'List Space Properties',
	description: 'Lists the content properties stored on a space.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the content properties (key/value JSON metadata) stored on a Confluence space, optionally filtered by key. Each result has the property ID and version that Update Space Property needs. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		spaceId: confluenceAiProps.spaceId({ required: true }),
		key: confluenceAiProps.propertyKey({
			required: false,
			description: 'Only the property with this key.',
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { spaceId, key, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'spaces',
			contentId: spaceId,
			relation: 'properties',
			query: { key, limit, cursor },
		});
	},
});
