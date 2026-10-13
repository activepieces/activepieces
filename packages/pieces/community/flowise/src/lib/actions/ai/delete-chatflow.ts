import { createAction } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseDeleteResultOutputSchema } from '../../output-schemas';

export const deleteChatflowAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_delete_chatflow',
	outputSchema: flowiseDeleteResultOutputSchema,
	displayName: 'Delete Chatflow',
	description: 'Permanently deletes a chatflow.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a chatflow by ID. This cannot be undone.',
		idempotent: false,
	},
	props: {
		chatflowId: flowiseAiProps.chatflowId({ required: true }),
	},
	async run(context) {
		return await flowiseApi.deleteChatflow({
			auth: context.auth,
			chatflowId: context.propsValue.chatflowId,
		});
	},
});
