import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderListSubscriberEventsOutputSchema } from '../../output-schemas';

export const senderListSubscriberEventsAction = createAction({
	auth: senderAuth,
	name: 'sender_list_subscriber_events',
	outputSchema: senderListSubscriberEventsOutputSchema,
	displayName: 'List Subscriber Events',
	description: "Lists a subscriber's campaign activity.",
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the campaign activity of one subscriber, found by email, phone or ID: emails received, opened, clicked, bounced and unsubscribed, with the campaign each came from.',
		idempotent: true,
	},
	props: {
		subscriberId: senderAiProps.subscriberId({ required: true }),
		actions: Property.StaticMultiSelectDropdown({
			displayName: 'Event Types',
			description: 'Which kinds of activity to return.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Received', value: 'got' },
					{ label: 'Opened', value: 'opened' },
					{ label: 'Clicked', value: 'clicked' },
					{ label: 'Bounced', value: 'bounced' },
					{ label: 'Unsubscribed', value: 'unsubscribed' },
				],
			},
		}),
	},
	async run(context) {
		const { subscriberId, actions } = context.propsValue;
		return await senderApi.listSubscriberEvents({ auth: context.auth, subscriberId, actions });
	},
});
