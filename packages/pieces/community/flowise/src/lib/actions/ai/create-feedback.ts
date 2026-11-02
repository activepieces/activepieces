import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseFeedbackOutputSchema } from '../../output-schemas';

export const createFeedbackAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_create_feedback',
	outputSchema: flowiseFeedbackOutputSchema,
	displayName: 'Create Feedback',
	description: 'Leaves feedback on a chat message.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Rates one bot message thumbs up or down, with an optional comment. The Chat ID and Message ID come from Make Prediction (`chatId`, `chatMessageId`) or List Chat Messages.',
		idempotent: false,
	},
	props: {
		chatflowId: flowiseAiProps.chatflowId({ required: true }),
		chatId: flowiseAiProps.chatId({ required: true }),
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description:
				'ID of the bot message to rate: `chatMessageId` from Make Prediction or `id` from List Chat Messages.',
			required: true,
		}),
		rating: Property.StaticDropdown({
			displayName: 'Rating',
			description: 'Thumbs up or thumbs down.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Thumbs up', value: 'THUMBS_UP' },
					{ label: 'Thumbs down', value: 'THUMBS_DOWN' },
				],
			},
		}),
		content: Property.LongText({
			displayName: 'Comment',
			description: 'Optional comment explaining the rating.',
			required: false,
		}),
	},
	async run(context) {
		const { chatflowId, chatId, messageId, rating, content } = context.propsValue;
		return await flowiseApi.createFeedback({
			auth: context.auth,
			fields: { chatflowid: chatflowId, chatId, messageId, rating, content },
		});
	},
});
