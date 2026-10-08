import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { CodaPage, codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { listControlsActionOutputSchema } from '../output-schemas';

export const listControlsAction = createAction({
	auth: codaAuth,
	name: 'list_controls',
	classification: 'SEARCH',
	displayName: 'List Controls',
	description: 'Lists the controls (sliders, pickers, buttons…) in a doc, one page at a time.',
	audience: 'both',
	aiMetadata: {
		description: 'Lists the controls of a Coda doc (sliders, select lists, date pickers, buttons…) with ID, name and page, one page at a time. Use to find a control before Get Control reads its value. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		limit: codaProps.limit({ max: 100, defaultValue: 25 }),
		pageToken: codaProps.pageToken(),
	},
	outputSchema: listControlsActionOutputSchema,
	async run(context) {
		const { docId, limit, pageToken } = context.propsValue;
		const page = await codaApi.request<CodaPage<unknown>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `${codaApi.docPath(docId)}/controls`,
			operation: 'list controls',
			query: {
				limit: codaApi.validateLimit({ limit, max: 100 }),
				pageToken: pageToken?.trim(),
			},
		});
		return codaApi.toPageOutput(page);
	},
});
