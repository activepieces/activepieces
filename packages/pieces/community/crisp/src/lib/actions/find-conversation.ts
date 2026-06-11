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
	audience: 'both',
	aiMetadata: { description: 'Text-searches conversations in a Crisp website and returns the first page of matches. Use to locate an existing thread (and its session ID) before acting on it. Requires both the website ID and a non-empty search query. Idempotent: a read-only search with no side effects.', idempotent: true },
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
