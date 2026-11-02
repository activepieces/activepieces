import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderListMembersOutputSchema } from '../../output-schemas';

export const senderListSegmentSubscribersAction = createAction({
	auth: senderAuth,
	name: 'sender_list_segment_subscribers',
	outputSchema: senderListMembersOutputSchema,
	displayName: 'List Segment Subscribers',
	description: 'Lists one page of the subscribers in a segment.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of the subscribers matching one segment, with their ID, email, name and statuses. Page through with Page and Limit using the returned meta.',
		idempotent: true,
	},
	props: {
		segmentId: senderAiProps.segmentId({ required: true }),
		page: senderAiProps.page({ required: false }),
		limit: senderAiProps.limit({ required: false }),
	},
	async run(context) {
		return await senderApi.listSegmentSubscribers({ auth: context.auth, ...context.propsValue });
	},
});
