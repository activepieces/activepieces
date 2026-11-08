import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { projectOutputSchema } from '../../output-schemas';

export const deleteProjectAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_delete_project',
	outputSchema: projectOutputSchema,
	displayName: 'Delete Project',
	description: 'Deletes an archived project.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a project with its tasks. Clockify only deletes archived projects, so archive it first with Update Project. Time entries on it lose their project.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		projectId: clockifyAiProps.projectId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.deleteProject({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
		});
	},
});
