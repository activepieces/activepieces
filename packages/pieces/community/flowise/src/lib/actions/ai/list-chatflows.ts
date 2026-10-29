import { createAction } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseListChatflowsOutputSchema } from '../../output-schemas';

export const listChatflowsAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_list_chatflows',
	outputSchema: flowiseListChatflowsOutputSchema,
	displayName: 'List Chatflows',
	description: 'Lists every chatflow in the Flowise workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists all chatflows (including agentflows) in the workspace with their ids, names, type and deployment state. Use it to find the Chatflow ID that Make Prediction, Get Chatflow and the chat message, feedback and lead actions take.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const chatflows = await flowiseApi.listChatflows({ auth: context.auth });
		return { chatflows, count: chatflows.length };
	},
});
