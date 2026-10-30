import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { templateOutputSchema } from '../../output-schemas';

export const createTemplateAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_create_template',
	outputSchema: templateOutputSchema,
	displayName: 'Create Template',
	description: 'Creates a timesheet template.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a timesheet template: a named set of project rows that can be loaded into a weekly timesheet. Returns the new template with its ID. Not idempotent.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: true }),
		projectIds: clockifyAiProps.idList({
			required: true,
			displayName: 'Project IDs',
			description: 'Projects to put on the template, one row each. Use List Projects.',
		}),
	},
	async run({ auth, propsValue }) {
		const [template] = await clockifyApi.createTemplates({
			auth,
			workspaceId: propsValue.workspaceId,
			templates: [
				{
					name: propsValue.name,
					projectsAndTasks: propsValue.projectIds.map((projectId) => ({
						projectId: String(projectId),
					})),
				},
			],
		});
		return template;
	},
});
