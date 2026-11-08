import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseChatflowOutputSchema } from '../../output-schemas';

export const createChatflowAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_create_chatflow',
	outputSchema: flowiseChatflowOutputSchema,
	displayName: 'Create Chatflow',
	description: 'Creates a new chatflow.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a new chatflow from a name, a type and a `flowData` graph. To copy an existing flow, pass the `flowData` returned by Get Chatflow. Each call creates another chatflow.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Name of the chatflow.',
			required: true,
		}),
		flowData: Property.LongText({
			displayName: 'Flow Data',
			description:
				'The flow graph as a JSON string, e.g. `{"nodes":[],"edges":[]}`. Copy it from Get Chatflow to clone a flow.',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'Kind of flow. Use CHATFLOW for a classic chatflow.',
			required: true,
			defaultValue: 'CHATFLOW',
			options: {
				disabled: false,
				options: [
					{ label: 'Chatflow', value: 'CHATFLOW' },
					{ label: 'Multi-agent', value: 'MULTIAGENT' },
					{ label: 'Agentflow', value: 'AGENTFLOW' },
				],
			},
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
		const { name, flowData, type, deployed, isPublic, category } = context.propsValue;
		return await flowiseApi.createChatflow({
			auth: context.auth,
			fields: { name, flowData, type, deployed, isPublic, category },
		});
	},
});
