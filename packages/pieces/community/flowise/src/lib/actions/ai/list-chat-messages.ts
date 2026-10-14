import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseListChatMessagesOutputSchema } from '../../output-schemas';

export const listChatMessagesAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_list_chat_messages',
	outputSchema: flowiseListChatMessagesOutputSchema,
	displayName: 'List Chat Messages',
	description: 'Lists the chat messages of a chatflow, with optional filters.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the user and bot messages of one chatflow. Filter by chat, session, chat type, date range or feedback type. Returns each message `id` (the `messageId` for Create Feedback) and its `chatId`.',
		idempotent: true,
	},
	props: {
		chatflowId: flowiseAiProps.chatflowId({ required: true }),
		chatId: flowiseAiProps.chatId({
			required: false,
			description: 'Only messages from this chat session.',
		}),
		sessionId: Property.ShortText({
			displayName: 'Session ID',
			description: 'Only messages with this memory session ID.',
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
		order: Property.StaticDropdown({
			displayName: 'Order',
			description: 'Sort by creation date. Defaults to ascending.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Oldest first', value: 'ASC' },
					{ label: 'Newest first', value: 'DESC' },
				],
			},
		}),
		feedbackType: Property.StaticDropdown({
			displayName: 'Feedback Type',
			description: 'Only messages that received this feedback.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Thumbs up', value: 'THUMBS_UP' },
					{ label: 'Thumbs down', value: 'THUMBS_DOWN' },
				],
			},
		}),
		startDate: flowiseAiProps.startDate({ required: false }),
		endDate: flowiseAiProps.endDate({ required: false }),
	},
	async run(context) {
		const { chatflowId, chatId, sessionId, chatType, order, feedbackType, startDate, endDate } =
			context.propsValue;
		const messages = await flowiseApi.listChatMessages({
			auth: context.auth,
			chatflowId,
			filters: {
				chatId,
				sessionId,
				chatType,
				order,
				startDate,
				endDate,
				feedback: feedbackType ? 'true' : undefined,
				feedbackType,
			},
		});
		return { messages, count: messages.length };
	},
});
