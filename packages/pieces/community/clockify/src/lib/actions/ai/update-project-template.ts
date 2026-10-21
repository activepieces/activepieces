import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { projectOutputSchema } from '../../output-schemas';

export const updateProjectTemplateAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_project_template',
	outputSchema: projectOutputSchema,
	displayName: 'Update Project Template',
	description: 'Marks a project as a template or not.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Marks a project as a template (Is Template = true) so Create Project from Template can copy it, or turns that off. Needs a Clockify plan with project templates (Pro or higher).',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		projectId: clockifyAiProps.projectId({ required: true }),
		isTemplate: Property.Checkbox({
			displayName: 'Is Template',
			description: 'true = make it a template, false = a regular project.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.updateProjectTemplate({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
			isTemplate: propsValue.isTemplate,
		});
	},
});
