import { createAction } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseChatflowOutputSchema } from '../../output-schemas';

export const getChatflowAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_get_chatflow',
	outputSchema: flowiseChatflowOutputSchema,
	displayName: 'Get Chatflow',
	description: 'Gets one chatflow by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one chatflow by ID, including its `flowData` graph (nodes and edges as a JSON string) and its chatbot and API config. Use the `flowData` with Create Chatflow to copy a flow.',
		idempotent: true,
	},
	props: {
		chatflowId: flowiseAiProps.chatflowId({ required: true }),
	},
	async run(context) {
		return await flowiseApi.getChatflow({
			auth: context.auth,
			chatflowId: context.propsValue.chatflowId,
		});
	},
});
