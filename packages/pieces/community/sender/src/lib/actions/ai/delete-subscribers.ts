import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderUtils } from '../../common/utils';
import { senderDeleteSubscribersOutputSchema } from '../../output-schemas';

export const senderDeleteSubscribersAction = createAction({
	auth: senderAuth,
	name: 'sender_delete_subscribers',
	outputSchema: senderDeleteSubscribersOutputSchema,
	displayName: 'Delete Subscribers',
	description: 'Deletes one or more subscribers.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes the listed subscribers from the Sender account, removing them from every group. To stop emails but keep the contact, use Update Subscriber with Email Status set to Unsubscribed instead.',
		idempotent: false,
	},
	props: {
		subscribers: senderAiProps.subscribers({
			required: true,
			description: 'Email addresses of the subscribers to delete, e.g. ["jane@example.com"].',
		}),
	},
	async run(context) {
		return await senderApi.deleteSubscribers({
			auth: context.auth,
			subscribers: senderUtils.requiredStringList({
				value: context.propsValue.subscribers,
				propName: 'Subscriber Emails',
			}),
		});
	},
});
