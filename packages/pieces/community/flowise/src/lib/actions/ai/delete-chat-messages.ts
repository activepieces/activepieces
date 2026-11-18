import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseDeleteResultOutputSchema } from '../../output-schemas';

export const deleteChatMessagesAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_delete_chat_messages',
	outputSchema: flowiseDeleteResultOutputSchema,
	displayName: 'Delete Chat Messages',
	description: 'Deletes the chat messages of a chatflow that match the filters.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes chat messages of one chatflow. Always pass a Chat ID to delete a single conversation: with no filters it deletes every message of the chatflow. Hard Delete also clears the chat memory.',
		idempotent: false,
	},
	props: {
		chatflowId: flowiseAiProps.chatflowId({ required: true }),
		chatId: flowiseAiProps.chatId({
			required: false,
			description: 'Only delete messages from this chat session.',
		}),
		sessionId: Property.ShortText({
			displayName: 'Session ID',
			description: 'Only delete messages with this memory session ID.',
			required: false,
		}),
		chatType: Property.StaticDropdown({
			displayName: 'Chat Type',
			description:
				'INTERNAL = chats from the Flowise UI, EXTERNAL = chats through the API or embed.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Internal', value: 'INTERNAL' },
					{ label: 'External', value: 'EXTERNAL' },
				],
			},
		}),
		startDate: flowiseAiProps.startDate({ required: false }),
		endDate: flowiseAiProps.endDate({ required: false }),
		hardDelete: Property.Checkbox({
			displayName: 'Hard Delete',
			description: 'Also delete the messages from the memory node of the flow.',
			required: false,
		}),
	},
	async run(context) {
		const { chatflowId, chatId, sessionId, chatType, startDate, endDate, hardDelete } =
			context.propsValue;
		return await flowiseApi.deleteChatMessages({
			auth: context.auth,
			chatflowId,
			filters: {
				chatId,
				sessionId,
				chatType,
				startDate,
				endDate,
				hardDelete: hardDelete ? 'true' : undefined,
			},
		});
	},
});
