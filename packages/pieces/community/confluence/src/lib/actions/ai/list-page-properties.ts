import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListPagePropertiesOutputSchema } from '../../output-schemas';

export const listPagePropertiesAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_page_properties',
	outputSchema: confluenceListPagePropertiesOutputSchema,
	displayName: 'List Page Properties',
	description: 'Lists the content properties stored on a page.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the content properties (key/value JSON metadata) stored on a Confluence page, optionally filtered by key. Each result has the property ID and version that Update Page Property needs. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		key: confluenceAiProps.propertyKey({
			required: false,
			description: 'Only the property with this key.',
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { pageId, key, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			relation: 'properties',
			query: { key, limit, cursor },
		});
	},
});
