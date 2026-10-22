import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderListSubscribersOutputSchema } from '../../output-schemas';

export const senderListSubscribersAction = createAction({
	auth: senderAuth,
	name: 'sender_list_subscribers',
	outputSchema: senderListSubscribersOutputSchema,
	displayName: 'List Subscribers',
	description: 'Lists one page of subscribers in your Sender account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of subscribers in the Sender account with their ID, email, name, phone, status per channel and groups. Use it to find a subscriber ID; to look up one known email use Get Subscriber. Returns 10 subscribers per page; page through with Page using the returned meta.last_page.',
		idempotent: true,
	},
	props: {
		page: senderAiProps.page({ required: false }),
	},
	async run(context) {
		const { page } = context.propsValue;
		return await senderApi.listSubscribers({ auth: context.auth, page });
	},
});
