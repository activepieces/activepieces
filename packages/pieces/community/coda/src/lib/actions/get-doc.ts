import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { getDocActionOutputSchema } from '../output-schemas';

export const getDocAction = createAction({
	auth: codaAuth,
	name: 'get_doc',
	classification: 'READ',
	displayName: 'Get Doc',
	description: 'Gets the details of a doc: name, owner, links, folder, workspace and size.',
	audience: 'both',
	aiMetadata: {
		description: 'Returns one Coda doc\'s metadata (name, owner, browser link, folder, workspace, page/table/row counts) by doc ID or link. Use to check a doc exists or to get its link; it does not return page text (use Get Page Content). Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
	},
	outputSchema: getDocActionOutputSchema,
	async run(context) {
		return codaApi.request({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: codaApi.docPath(context.propsValue.docId),
			operation: 'get doc',
		});
	},
});
