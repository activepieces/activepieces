import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { hydratedTemplateOutputSchema } from '../../output-schemas';

export const getTemplateAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_get_template',
	outputSchema: hydratedTemplateOutputSchema,
	displayName: 'Get Template',
	description: 'Gets a timesheet template by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one timesheet template by ID, with its project and task rows when Include Details is set.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		templateId: clockifyAiProps.templateId({ required: true }),
		hydrated: Property.Checkbox({
			displayName: 'Include Details',
			description: 'Return the template projects, tasks and entries. Default false.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.getTemplate({
			auth,
			workspaceId: propsValue.workspaceId,
			templateId: propsValue.templateId,
			query: clockifyUtils.toQuery({ params: { hydrated: propsValue.hydrated } }),
		});
	},
});
