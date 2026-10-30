import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { projectOutputSchema } from '../../output-schemas';

export const createProjectFromTemplateAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_create_project_from_template',
	outputSchema: projectOutputSchema,
	displayName: 'Create Project from Template',
	description: 'Creates a project from a template project.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a project copied from a template project (its tasks, rates and settings). Template projects are found with List Projects and Template = Yes, and made with Update Project Template. Needs a Clockify plan with project templates (Pro or higher). Not idempotent.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		templateProjectId: clockifyAiProps.projectId({
			required: true,
			displayName: 'Template Project ID',
			description: 'ID of a template project. Use List Projects with Template = Yes.',
		}),
		name: Property.ShortText({ displayName: 'Name', required: true }),
		clientId: clockifyAiProps.clientId({
			required: false,
			description: 'Optional client ID. Use List Clients to find it.',
		}),
		color: Property.ShortText({
			displayName: 'Color',
			description: 'Hex color, for example #03A9F4.',
			required: false,
		}),
		isPublic: Property.Checkbox({
			displayName: 'Public',
			description: 'Every workspace member can track time on it. Default false.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.createProjectFromTemplate({
			auth,
			workspaceId: propsValue.workspaceId,
			project: {
				templateProjectId: propsValue.templateProjectId,
				name: propsValue.name,
				clientId: propsValue.clientId,
				color: propsValue.color,
				isPublic: propsValue.isPublic,
			},
		});
	},
});
