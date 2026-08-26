import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import type { TallyFolder, TallyPaginated } from '../common/types';

export const listWorkspaceFolders = createAction({
	auth: tallyAuth,
	name: 'list_workspace_folders',
	displayName: 'List Workspace Folders',
	description: 'Lists folders inside a workspace (requires Tally Pro).',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Lists folders in a workspace, paginated. Folders organise forms within a workspace and are a Pro-tier feature — a non-Pro account receives a 403. Use to discover a folder id before creating or moving folders. Obtain the workspace id from List Workspaces.',
		idempotent: true,
	},
	props: {
		workspace_id: Property.ShortText({
			displayName: 'Workspace ID',
			description: 'The id of the workspace. Obtain from List Workspaces.',
			required: true,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number to fetch, starting at 1.',
			required: false,
			defaultValue: 1,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum folders per page.',
			required: false,
			defaultValue: 50,
		}),
	},
	async run(context) {
		return tallyApiClient.request<TallyPaginated<TallyFolder>>({
			method: HttpMethod.GET,
			path: `/workspaces/${context.propsValue.workspace_id}/folders`,
			apiKey: context.auth.secret_text,
			queryParams: {
				page: String(context.propsValue.page ?? 1),
				limit: String(context.propsValue.limit ?? 50),
			},
		});
	},
});
