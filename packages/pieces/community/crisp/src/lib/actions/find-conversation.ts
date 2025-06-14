import { createAction, Property } from '@activepieces/pieces-framework';
import { crispAuth } from '../common/common';
import { crispClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';   

export const findConversation = createAction({
  auth: crispAuth,
  name: 'find_conversation',
  displayName: 'Find Conversation',
  description: 'Searches for conversations matching the specified criteria',
  props: {
    websiteId: Property.ShortText({
      displayName: 'Website ID',
      required: true
    }),
    searchQuery: Property.ShortText({
      displayName: 'Search Query',
      description: 'Email, keyword, or conversation ID to search for',
      required: true
    }),
    searchType: Property.StaticDropdown({
      displayName: 'Search Type',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All Conversations', value: 'all' },
          { label: 'Unresolved Only', value: 'unresolved' },
          { label: 'Resolved Only', value: 'resolved' }
        ]
      }
    }),
    limit: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of results to return (1-100)',
      required: false,
      defaultValue: 10,
    })
  },
  async run(context) {
    const { websiteId, searchQuery, searchType, limit } = context.propsValue;
    if (!websiteId || !searchQuery) {
      throw new Error('Website ID and search query are required');
    }
    const params = new URLSearchParams();
    params.append('search_query', searchQuery);
    params.append('search_type', searchType || 'all');
    params.append('limit', (limit || 10).toString());

    return await crispClient.makeRequest(
      context.auth,
      HttpMethod.GET,
      `/website/${websiteId}/conversations/search?${params.toString()}`
    );
  }
});