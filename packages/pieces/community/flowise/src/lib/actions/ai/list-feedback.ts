import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseListFeedbackOutputSchema } from '../../output-schemas';

export const listFeedbackAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_list_feedback',
	outputSchema: flowiseListFeedbackOutputSchema,
	displayName: 'List Feedback',
	description: 'Lists the chat message feedback of a chatflow.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists thumbs-up / thumbs-down feedback left on the messages of one chatflow, optionally for one chat and a date range. Returns each feedback `id` for Update Feedback.',
		idempotent: true,
	},
	props: {
		chatflowId: flowiseAiProps.chatflowId({ required: true }),
		chatId: flowiseAiProps.chatId({
			required: false,
			description: 'Only feedback from this chat session.',
		}),
		sortOrder: Property.StaticDropdown({
			displayName: 'Sort Order',
			description: 'Sort by creation date.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Oldest first', value: 'asc' },
					{ label: 'Newest first', value: 'desc' },
				],
			},
		}),
		startDate: flowiseAiProps.startDate({ required: false }),
		endDate: flowiseAiProps.endDate({ required: false }),
	},
	async run(context) {
		const { chatflowId, chatId, sortOrder, startDate, endDate } = context.propsValue;
		const feedback = await flowiseApi.listFeedback({
			auth: context.auth,
			chatflowId,
			filters: { chatId, sortOrder, startDate, endDate },
		});
		return { feedback, count: feedback.length };
	},
});
