import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import type { TallyPaginated, TallyWorkspace } from '../common/types';
import { listWorkspacesOutputSchema } from '../output-schemas';

export const listWorkspaces = createAction({
	auth: tallyAuth,
	name: 'list_workspaces',
	displayName: 'List Workspaces',
	description: 'Lists workspaces accessible to the authenticated user.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Lists workspaces accessible to the authenticated user, paginated. Use to discover a workspace id before Create Form, folder operations, or workspace admin. Get Current User also returns the workspace list on the user profile — prefer that call when you only need the ids and not the paginated metadata.',
		idempotent: true,
	},
	outputSchema: listWorkspacesOutputSchema,
	props: {
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number to fetch, starting at 1.',
			required: false,
			defaultValue: 1,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum workspaces per page.',
			required: false,
			defaultValue: 50,
		}),
	},
	async run(context) {
		return tallyApiClient.request<TallyPaginated<TallyWorkspace>>({
			method: HttpMethod.GET,
			path: '/workspaces',
			apiKey: context.auth.secret_text,
			queryParams: {
				page: String(context.propsValue.page ?? 1),
			},
		});
	},
});
