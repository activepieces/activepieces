import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceSearchContentOutputSchema } from '../../output-schemas';

export const searchContentAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_search_content',
	outputSchema: confluenceSearchContentOutputSchema,
	displayName: 'Search Content',
	description: 'Searches content with CQL and returns matches with excerpts.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Searches Confluence pages, blog posts, attachments, comments and spaces with a CQL query, returning each match with a highlighted excerpt and its content ID. Use List Pages for a simple title or space filter. For the next page, pass nextCursor from the previous call with the same query as Cursor.',
		idempotent: true,
	},
	props: {
		cql: Property.LongText({
			displayName: 'CQL',
			description:
				'Confluence Query Language query, e.g. type = page AND space = "DOCS" AND text ~ "release".',
			required: true,
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
		includeArchivedSpaces: Property.Checkbox({
			displayName: 'Include Archived Spaces',
			required: false,
		}),
	},
	async run(context) {
		const { cql, limit, cursor, includeArchivedSpaces } = context.propsValue;
		return await confluenceApi.searchByCql({
			auth: context.auth,
			query: {
				cql,
				limit: limit ?? 25,
				cursor,
				includeArchivedSpaces: includeArchivedSpaces || undefined,
				excerpt: 'highlight',
			},
		});
	},
});
