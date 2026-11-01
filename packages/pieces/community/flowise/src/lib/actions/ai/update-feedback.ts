import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseUpdateFeedbackOutputSchema } from '../../output-schemas';

export const updateFeedbackAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_update_feedback',
	outputSchema: flowiseUpdateFeedbackOutputSchema,
	displayName: 'Update Feedback',
	description: 'Changes the rating or comment of a feedback entry.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the rating or comment of one feedback entry by ID (from List Feedback or Create Feedback). Fields left empty stay as they are. Flowise returns only `{ status: "OK" }`; read the result with List Feedback.',
		idempotent: true,
	},
	props: {
		feedbackId: Property.ShortText({
			displayName: 'Feedback ID',
			description: 'ID of the feedback entry, from List Feedback or Create Feedback.',
			required: true,
		}),
		rating: Property.StaticDropdown({
			displayName: 'Rating',
			description: 'New rating.',
			required: false,
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
			description: 'New comment.',
			required: false,
		}),
	},
	async run(context) {
		const { feedbackId, rating, content } = context.propsValue;
		return await flowiseApi.updateFeedback({
			auth: context.auth,
			feedbackId,
			fields: { rating, content },
		});
	},
});
