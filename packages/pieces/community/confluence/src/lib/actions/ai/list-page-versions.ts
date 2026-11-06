import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListPageVersionsOutputSchema } from '../../output-schemas';

export const listPageVersionsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_page_versions',
	outputSchema: confluenceListPageVersionsOutputSchema,
	displayName: 'List Page Versions',
	description: 'Lists the version history of a page.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the versions of a Confluence page with their number, author, date and message. Use the version number with Get Page Version or Restore Page Version. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Newest first', value: '-modified-date' },
					{ label: 'Oldest first', value: 'modified-date' },
				],
			},
		}),
		bodyFormat: confluenceAiProps.readBodyFormat({ required: false }),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { pageId, sort, bodyFormat, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			relation: 'versions',
			query: { sort, 'body-format': bodyFormat, limit, cursor },
		});
	},
});
