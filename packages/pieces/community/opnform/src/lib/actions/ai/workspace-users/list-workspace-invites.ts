import { createAction } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformAiProps } from '../../../common/ai-props';
import { opnformApi } from '../../../common/api';
import { opnformListWorkspaceInvitesOutputSchema } from '../../../output-schemas';

export const opnformListWorkspaceInvitesAction = createAction({
	auth: opnformAuth,
	name: 'opnform_list_workspace_invites',
	outputSchema: opnformListWorkspaceInvitesOutputSchema,
	displayName: 'List Workspace Invites',
	description: 'Lists the pending and accepted invites of a workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the invites of a workspace with their id, email, role, status and expiry. Requires workspace admin.',
		idempotent: true,
	},
	props: {
		workspaceId: opnformAiProps.workspaceId({ required: true }),
	},
	async run(context) {
		const invites = await opnformApi.listWorkspaceInvites({
			auth: context.auth,
			workspaceId: context.propsValue.workspaceId,
		});
		return { invites, count: invites.length };
	},
});
