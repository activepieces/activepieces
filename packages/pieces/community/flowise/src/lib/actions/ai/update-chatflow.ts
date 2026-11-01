import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseChatflowOutputSchema } from '../../output-schemas';

export const updateChatflowAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_update_chatflow',
	outputSchema: flowiseChatflowOutputSchema,
	displayName: 'Update Chatflow',
	description: 'Updates a chatflow. Only the fields you set are changed.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a chatflow by ID: name, flow graph, deployment, public access or category. Fields left empty stay as they are.',
		idempotent: true,
	},
	props: {
		chatflowId: flowiseAiProps.chatflowId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New name of the chatflow.',
			required: false,
		}),
		flowData: Property.LongText({
			displayName: 'Flow Data',
			description: 'New flow graph as a JSON string; replaces the whole graph.',
			required: false,
		}),
		deployed: flowiseAiProps.yesNo({
			required: false,
			displayName: 'Deployed',
			description: 'Whether the chatflow is deployed.',
		}),
		isPublic: flowiseAiProps.yesNo({
			required: false,
			displayName: 'Public',
			description: 'Whether the chatflow is publicly accessible without an API key.',
		}),
		category: Property.ShortText({
			displayName: 'Category',
			description: 'Category tags, separated by `;`.',
			required: false,
		}),
	},
	async run(context) {
		const { chatflowId, name, flowData, deployed, isPublic, category } = context.propsValue;
		return await flowiseApi.updateChatflow({
			auth: context.auth,
			chatflowId,
			fields: { name, flowData, deployed, isPublic, category },
		});
	},
});
