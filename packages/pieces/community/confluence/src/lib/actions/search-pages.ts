import { createAction, Property } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import * as z from 'zod/mini'
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { searchPagesOutputSchema } from '../output-schemas';

export const searchPagesAction = createAction({
	auth: confluenceAuth,
	name: 'search-pages',
	outputSchema: searchPagesOutputSchema,
	classification: 'SEARCH',
	displayName: 'Search Content (CQL)',
	description:
		'Search Confluence content with CQL (Confluence Query Language). Example: `type = "page" AND space = "DOCS" AND title ~ "release"`.',
	audience: 'human',
	aiMetadata: { description: 'Searches Confluence content using a CQL (Confluence Query Language) expression, paginating until the max-results cap is reached. Use for flexible, multi-criteria or keyword search across pages/blogposts/comments (by type, space, title, label, date, text); use Find Page by Title for exact-title lookups instead. Requires a valid CQL string. Read-only and idempotent.', idempotent: true },
	props: {
		cql: Property.LongText({
			displayName: 'CQL',
			description:
				'Confluence Query Language expression. See https://developer.atlassian.com/cloud/confluence/advanced-searching-using-cql/',
			required: true,
			defaultValue: 'type = "page" ORDER BY lastmodified DESC',
		}),
		maxResults: Property.Number({
			displayName: 'Max Results',
			required: true,
			defaultValue: 25,
		}),
		expand: Property.ShortText({
			displayName: 'Expand',
			description:
				'Comma-separated list of properties to expand (e.g. `body.storage,version,space,history`).',
			required: false,
		}),
	},
	async run(context) {
		const { cql, maxResults, expand } = context.propsValue;

		await propsValidation.validateZod(context.propsValue, {
			maxResults: z.number().check(z.minimum(1), z.maximum(1000)),
		});

		const all = await confluenceApi.searchContent({ auth: context.auth, cql, maxResults, expand });

		return { results: all, count: all.length };
	},
});
