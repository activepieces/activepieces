import { createAction } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseListToolsOutputSchema } from '../../output-schemas';

export const listToolsAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_list_tools',
	outputSchema: flowiseListToolsOutputSchema,
	displayName: 'List Tools',
	description: 'Lists the custom tools in the workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the custom tools in the workspace with their ids, names, input schema and JavaScript function.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const tools = await flowiseApi.listTools({ auth: context.auth });
		return { tools, count: tools.length };
	},
});
