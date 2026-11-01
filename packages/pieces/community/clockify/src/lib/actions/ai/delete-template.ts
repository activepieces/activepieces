import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { templateOutputSchema } from '../../output-schemas';

export const deleteTemplateAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_delete_template',
	outputSchema: templateOutputSchema,
	displayName: 'Delete Template',
	description: 'Deletes a timesheet template.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a timesheet template. Time entries made from it are untouched.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		templateId: clockifyAiProps.templateId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.deleteTemplate({
			auth,
			workspaceId: propsValue.workspaceId,
			templateId: propsValue.templateId,
		});
	},
});
