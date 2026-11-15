import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { templateOutputSchema } from '../../output-schemas';

export const updateTemplateAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_template',
	outputSchema: templateOutputSchema,
	displayName: 'Update Template',
	description: 'Renames a timesheet template.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Renames a timesheet template (the name is the only field Clockify lets you change).',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		templateId: clockifyAiProps.templateId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.renameTemplate({
			auth,
			workspaceId: propsValue.workspaceId,
			templateId: propsValue.templateId,
			name: propsValue.name,
		});
	},
});
