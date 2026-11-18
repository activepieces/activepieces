import { createAction, Property } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformAiProps } from '../../../common/ai-props';
import { opnformApi } from '../../../common/api';
import { opnformUpdateWorkspaceOutputSchema } from '../../../output-schemas';

export const opnformUpdateWorkspaceAction = createAction({
	auth: opnformAuth,
	name: 'opnform_update_workspace',
	outputSchema: opnformUpdateWorkspaceOutputSchema,
	displayName: 'Update Workspace',
	description: 'Renames a workspace or changes its icon.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Renames a workspace or changes its emoji icon. Fields left empty keep their current value. Requires workspace admin.',
		idempotent: true,
	},
	props: {
		workspaceId: opnformAiProps.workspaceId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New workspace name. Leave empty to keep the current name.',
			required: false,
		}),
		emoji: Property.ShortText({
			displayName: 'Emoji',
			description: 'New emoji icon, e.g. "🚀". Leave empty to keep the current icon.',
			required: false,
		}),
	},
	async run(context) {
		const { workspaceId, name, emoji } = context.propsValue;
		const workspaces = await opnformApi.listWorkspaces({ auth: context.auth });
		const current = workspaces.find((workspace) => String(workspace.id) === workspaceId);
		if (!current) {
			throw new Error(
				`Workspace ${workspaceId} not found. Use List Workspaces to find a valid Workspace ID.`,
			);
		}
		return await opnformApi.updateWorkspace({
			auth: context.auth,
			workspaceId,
			name: name ?? current.name,
			emoji: emoji ?? current.icon,
		});
	},
});
