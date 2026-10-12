import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { CodaPage, codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { listFoldersActionOutputSchema } from '../output-schemas';

export const listFoldersAction = createAction({
	auth: codaAuth,
	name: 'list_folders',
	classification: 'SEARCH',
	displayName: 'List Folders',
	description: 'Lists the folders the connected account can see, one page at a time.',
	audience: 'both',
	aiMetadata: {
		description: 'Lists Coda folders (ID, name, workspace) the account can see, one page at a time. Use to find a folder ID for Create Doc or List Docs. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		workspaceId: Property.ShortText({
			displayName: 'Workspace ID',
			description: 'Only folders in this workspace (starts with "ws-").',
			required: false,
		}),
		isStarred: Property.Checkbox({
			displayName: 'Only Starred Folders',
			required: false,
			defaultValue: false,
		}),
		limit: codaProps.limit({ max: 100, defaultValue: 25 }),
		pageToken: codaProps.pageToken(),
	},
	outputSchema: listFoldersActionOutputSchema,
	async run(context) {
		const { workspaceId, isStarred, limit, pageToken } = context.propsValue;
		const page = await codaApi.request<CodaPage<unknown>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: '/folders',
			operation: 'list folders',
			query: {
				workspaceId: workspaceId?.trim(),
				isStarred: isStarred === true ? true : undefined,
				limit: codaApi.validateLimit({ limit, max: 100 }),
				pageToken: pageToken?.trim(),
			},
		});
		return codaApi.toPageOutput(page);
	},
});
