import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { moderationUtils, ModerationResponse } from '../common/moderation';
import { moderateChatOutputSchema } from '../output-schemas';

export const moderateChat = createAction({
	auth: mistralAuth,
	name: 'moderate_chat',
	classification: 'READ',
	displayName: 'Moderate Chat',
	description: 'Check a conversation for harmful content.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Classifies a conversation (user and assistant turns) against Mistral’s moderation categories, judging the last turn in the context of the earlier ones, and returns flags, scores and the flagged categories. Use this for chat transcripts; use Moderate Text for standalone strings. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: moderateChatOutputSchema,
	props: {
		messages: Property.Array({
			displayName: 'Messages',
			description: 'The conversation to check, oldest first.',
			required: true,
			properties: {
				role: Property.StaticDropdown({
					displayName: 'Role',
					required: true,
					defaultValue: 'user',
					options: {
						options: [
							{ label: 'User', value: 'user' },
							{ label: 'Assistant', value: 'assistant' },
							{ label: 'System', value: 'system' },
						],
					},
				}),
				content: Property.LongText({ displayName: 'Content', required: true }),
			},
		}),
		model: Property.ShortText({
			displayName: 'Model',
			required: true,
			defaultValue: 'mistral-moderation-latest',
		}),
	},
	async run(context) {
		const messages = (context.propsValue.messages ?? []).filter(mistralApi.isRecord).map((message) => ({
			role: String(message['role'] ?? 'user'),
			content: String(message['content'] ?? ''),
		}));
		if (messages.length === 0) {
			throw new Error('Provide at least one message.');
		}
		const response = await mistralApi.call<ModerationResponse>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/chat/moderations',
			body: { model: context.propsValue.model, input: messages },
		});
		return moderationUtils.formatResponse({ response, inputs: [messages[messages.length - 1].content] });
	},
});
