import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyApi } from '../../common/api';
import { workspaceOutputSchema } from '../../output-schemas';

import type { ClockifyAuthValue } from '../../common/types';

export const createWorkspaceAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_create_workspace',
	outputSchema: workspaceOutputSchema,
	displayName: 'Create Workspace',
	description: 'Creates a new workspace.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a new Clockify workspace owned by the connected user, in the same organization as the active workspace unless Organization ID is set, and returns it with its new ID. Clockify has no API to delete a workspace, so only call this when a new workspace is really wanted. Not idempotent: each call creates another workspace.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Name of the new workspace.',
			required: true,
		}),
		organizationId: Property.ShortText({
			displayName: 'Organization ID',
			description:
				'Optional organization to create the workspace in: the cakeOrganizationId of an existing workspace (Get Workspace). Empty = the organization of your active workspace.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const organizationId = propsValue.organizationId ?? (await activeOrganizationId({ auth }));
		return await clockifyApi.createWorkspace({
			auth,
			name: propsValue.name,
			organizationId,
		});
	},
});

async function activeOrganizationId({
	auth,
}: {
	auth: ClockifyAuthValue;
}): Promise<string | undefined> {
	const user = await clockifyApi.getCurrentUser({ auth });
	if (!user.activeWorkspace) {
		return undefined;
	}
	const workspace = await clockifyApi.getWorkspace({
		auth,
		workspaceId: user.activeWorkspace,
	});
	return workspace.cakeOrganizationId;
}
