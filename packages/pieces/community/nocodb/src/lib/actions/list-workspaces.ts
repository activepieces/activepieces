import { nocodbAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { ListAPIResponse, WorkspaceResponse } from '../common/types';
import { nocodbListWorkspacesOutputSchema } from '../output-schemas';

export const listWorkspacesAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-list-workspaces',
	outputSchema: nocodbListWorkspacesOutputSchema,
	classification: 'READ',
	displayName: 'List Workspaces',
	description: 'Returns the workspaces visible to the authenticated account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the Cloud/Enterprise workspaces the account belongs to, used to resolve a workspace ID before listing its bases. On self-hosted Community Edition, workspaces do not exist and this returns an empty list rather than an error. Idempotent read-only query.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const client = makeClient(context.auth);
		try {
			return await client.listWorkspaces();
		} catch (error) {
			const emptyList: ListAPIResponse<WorkspaceResponse> = {
				list: [],
				pageInfo: {
					totalRows: 0,
					page: 1,
					pageSize: 0,
					isFirstPage: true,
					isLastPage: true,
				},
			};
			return emptyList;
		}
	},
});
