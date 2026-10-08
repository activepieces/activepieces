import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { CodaPage, codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { listFormulasActionOutputSchema } from '../output-schemas';

export const listFormulasAction = createAction({
	auth: codaAuth,
	name: 'list_formulas',
	classification: 'SEARCH',
	displayName: 'List Named Formulas',
	description: 'Lists the named formulas in a doc, one page at a time.',
	audience: 'both',
	aiMetadata: {
		description: 'Lists the named formulas of a Coda doc (ID, name, page) one page at a time. Use to find a formula before Get Named Formula reads its current value. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		limit: codaProps.limit({ max: 100, defaultValue: 25 }),
		pageToken: codaProps.pageToken(),
	},
	outputSchema: listFormulasActionOutputSchema,
	async run(context) {
		const { docId, limit, pageToken } = context.propsValue;
		const page = await codaApi.request<CodaPage<unknown>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `${codaApi.docPath(docId)}/formulas`,
			operation: 'list formulas',
			query: {
				limit: codaApi.validateLimit({ limit, max: 100 }),
				pageToken: pageToken?.trim(),
			},
		});
		return codaApi.toPageOutput(page);
	},
});
