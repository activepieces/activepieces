import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { crispAuth } from '../common/auth';
import { websiteIdProp } from '../common/props';
import { crispApiCall } from '../common/client';

export const findConversationAction = createAction({
	auth: crispAuth,
	name: 'find_conversation',
	displayName: 'Find Conversation',
	description: 'Searches for conversations matching the specified criteria.',
	props: {
		websiteId: websiteIdProp,
		searchQuery: Property.ShortText({
			displayName: 'Search Query',
			required: true,
		}),
	},
	async run(context) {
		const { websiteId, searchQuery } = context.propsValue;
		if (!websiteId || !searchQuery) {
			throw new Error('Website ID and search query are required');
		}

		const response = await crispApiCall<{ data: Record<string, any>[] }>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/website/${websiteId}/conversations/1`,
			query: {
				search_query: searchQuery,
				search_type: 'text',
			},
		});

		return {
			found: response.data.length > 0,
			data: response.data,
		};
	},
});
