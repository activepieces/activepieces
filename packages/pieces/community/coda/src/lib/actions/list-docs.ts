import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { CodaPage, codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { listDocsActionOutputSchema } from '../output-schemas';

export const listDocsAction = createAction({
	auth: codaAuth,
	name: 'list_docs',
	classification: 'SEARCH',
	displayName: 'List Docs',
	description: 'Lists the docs the connected account can open, one page at a time, with optional search and filters.',
	audience: 'both',
	aiMetadata: {
		description: 'Lists Coda docs the account can access, optionally filtered by a name search, owner, starred state, folder or workspace, one page at a time. Use to find a doc ID before working inside a doc; pass Next Page Token to continue. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		query: Property.ShortText({
			displayName: 'Search',
			description: 'Only docs whose name contains this text.',
			required: false,
		}),
		isOwner: Property.Checkbox({
			displayName: 'Only Docs I Own',
			required: false,
			defaultValue: false,
		}),
		isStarred: Property.Checkbox({
			displayName: 'Only Starred Docs',
			required: false,
			defaultValue: false,
		}),
		folderId: Property.ShortText({
			displayName: 'Folder ID',
			description: 'Only docs in this folder (starts with "fl-"). Use List Folders to find it.',
			required: false,
		}),
		workspaceId: Property.ShortText({
			displayName: 'Workspace ID',
			description: 'Only docs in this workspace (starts with "ws-").',
			required: false,
		}),
		limit: codaProps.limit({ max: 100, defaultValue: 25 }),
		pageToken: codaProps.pageToken(),
	},
	outputSchema: listDocsActionOutputSchema,
	async run(context) {
		const { query, isOwner, isStarred, folderId, workspaceId, limit, pageToken } = context.propsValue;
		const page = await codaApi.request<CodaPage<unknown>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: '/docs',
			operation: 'list docs',
			query: {
				query: query?.trim(),
				isOwner: isOwner === true ? true : undefined,
				isStarred: isStarred === true ? true : undefined,
				folderId: folderId?.trim(),
				workspaceId: workspaceId?.trim(),
				limit: codaApi.validateLimit({ limit, max: 100 }),
				pageToken: pageToken?.trim(),
			},
		});
		return codaApi.toPageOutput(page);
	},
});
