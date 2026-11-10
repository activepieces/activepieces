import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { getPageActionOutputSchema } from '../output-schemas';

export const getPageAction = createAction({
	auth: codaAuth,
	name: 'get_page',
	classification: 'READ',
	displayName: 'Get Page',
	description: 'Gets a page\'s details: name, subtitle, parent, subpages, visibility and links.',
	audience: 'both',
	aiMetadata: {
		description: 'Returns one Coda page\'s metadata (name, subtitle, parent, subpages, hidden state, authors, link) by page ID or name. It does not return the page text; use Get Page Content for that. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		pageIdOrName: codaProps.pageIdOrName(),
	},
	outputSchema: getPageActionOutputSchema,
	async run(context) {
		const { docId, pageIdOrName } = context.propsValue;
		return codaApi.request({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `${codaApi.docPath(docId)}/pages/${codaApi.pathSegment({ value: pageIdOrName, label: 'Page ID or name' })}`,
			operation: 'get page',
		});
	},
});
