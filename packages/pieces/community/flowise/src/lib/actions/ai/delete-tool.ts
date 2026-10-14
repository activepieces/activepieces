import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseDeleteResultOutputSchema } from '../../output-schemas';

export const deleteToolAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_delete_tool',
	outputSchema: flowiseDeleteResultOutputSchema,
	displayName: 'Delete Tool',
	description: 'Permanently deletes a custom tool.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a custom tool by ID. Flows that use it stop working. This cannot be undone.',
		idempotent: false,
	},
	props: {
		toolId: Property.ShortText({
			displayName: 'Tool ID',
			description: 'ID of the tool, from List Tools.',
			required: true,
		}),
	},
	async run(context) {
		return await flowiseApi.deleteTool({ auth: context.auth, toolId: context.propsValue.toolId });
	},
});
