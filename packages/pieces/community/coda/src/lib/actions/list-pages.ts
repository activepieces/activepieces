import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { CodaPage, codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { listPagesActionOutputSchema } from '../output-schemas';

export const listPagesAction = createAction({
	auth: codaAuth,
	name: 'list_pages',
	classification: 'SEARCH',
	displayName: 'List Pages',
	description: 'Lists the pages of a doc, one page of results at a time.',
	audience: 'both',
	aiMetadata: {
		description: 'Lists the pages (and subpages) of a Coda doc with their IDs, names, parent and visibility, one page of results at a time. Use to find a page ID before Get Page Content, Update Page or Delete Page; pass Next Page Token to continue. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		limit: codaProps.limit({ max: 100, defaultValue: 25 }),
		pageToken: codaProps.pageToken(),
	},
	outputSchema: listPagesActionOutputSchema,
	async run(context) {
		const { docId, limit, pageToken } = context.propsValue;
		const page = await codaApi.request<CodaPage<unknown>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `${codaApi.docPath(docId)}/pages`,
			operation: 'list pages',
			query: {
				limit: codaApi.validateLimit({ limit, max: 100 }),
				pageToken: pageToken?.trim(),
			},
		});
		return codaApi.toPageOutput(page);
	},
});
