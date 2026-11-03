import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderListMembersOutputSchema } from '../../output-schemas';

export const senderListGroupSubscribersAction = createAction({
	auth: senderAuth,
	name: 'sender_list_group_subscribers',
	outputSchema: senderListMembersOutputSchema,
	displayName: 'List Group Subscribers',
	description: 'Lists one page of the subscribers in a group.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of the subscribers in one group, with their ID, email, name and statuses. Page through with Page and Limit using the returned meta. Sender answers an empty group with the error "This group has no active subscribers".',
		idempotent: true,
	},
	props: {
		groupId: senderAiProps.groupId({ required: true }),
		page: senderAiProps.page({ required: false }),
		limit: senderAiProps.limit({ required: false }),
	},
	async run(context) {
		return await senderApi.listGroupSubscribers({ auth: context.auth, ...context.propsValue });
	},
});
