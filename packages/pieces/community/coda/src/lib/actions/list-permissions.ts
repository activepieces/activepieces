import { createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { codaPermissions } from '../common/permissions';
import { listPermissionsActionOutputSchema } from '../output-schemas';

export const listPermissionsAction = createAction({
	auth: codaAuth,
	name: 'list_permissions',
	classification: 'SEARCH',
	displayName: 'List Doc Sharing',
	description: 'Lists who a doc is shared with and their access level, one page at a time.',
	audience: 'both',
	aiMetadata: {
		description: 'Lists the people, domains or link-sharing entries a Coda doc is shared with, each with a permission ID and access level (readonly, comment, write), one page at a time. Use to find the permission ID before Remove Doc Sharing. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		limit: codaProps.limit({ max: 100, defaultValue: 25 }),
		pageToken: codaProps.pageToken(),
	},
	outputSchema: listPermissionsActionOutputSchema,
	async run(context) {
		const { docId, limit, pageToken } = context.propsValue;
		const page = await codaPermissions.listPermissions({
			token: context.auth.secret_text,
			docId,
			limit: codaApi.validateLimit({ limit, max: 100 }),
			pageToken: pageToken?.trim() || undefined,
		});
		return codaApi.toPageOutput(page);
	},
});
