import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseToolOutputSchema } from '../../output-schemas';

export const getToolAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_get_tool',
	outputSchema: flowiseToolOutputSchema,
	displayName: 'Get Tool',
	description: 'Gets one custom tool by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one custom tool by ID, including its input schema and JavaScript function.',
		idempotent: true,
	},
	props: {
		toolId: Property.ShortText({
			displayName: 'Tool ID',
			description: 'ID of the tool, from List Tools.',
			required: true,
		}),
	},
	async run(context) {
		return await flowiseApi.getTool({ auth: context.auth, toolId: context.propsValue.toolId });
	},
});
