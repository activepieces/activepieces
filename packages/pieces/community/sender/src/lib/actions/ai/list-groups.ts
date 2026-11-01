import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderListGroupsOutputSchema } from '../../output-schemas';

export const senderListGroupsAction = createAction({
	auth: senderAuth,
	name: 'sender_list_groups',
	outputSchema: senderListGroupsOutputSchema,
	displayName: 'List Groups',
	description: 'Lists one page of subscriber groups.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of subscriber groups (lists) with their ID, title and subscriber counts. Use it to find a group ID for the group and subscriber actions. Page through with Page and Limit using the returned meta.',
		idempotent: true,
	},
	props: {
		page: senderAiProps.page({ required: false }),
		limit: senderAiProps.limit({ required: false }),
	},
	async run(context) {
		return await senderApi.listGroups({ auth: context.auth, ...context.propsValue });
	},
});
