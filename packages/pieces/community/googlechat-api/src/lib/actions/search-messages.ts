import { googleChatApiAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const searchMessages = createAction({
  auth: googleChatApiAuth,
  name: 'search-messages',
  displayName: 'Search Messages',
  description: 'Search within Chat for messages matching keywords or filters',
  props: {
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The ID of the space to search in',
      required: true,
    }),
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The search query or keywords to look for',
      required: true,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of messages to return (max 100)',
      required: false,
      defaultValue: 25,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token for pagination',
      required: false,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const { spaceId, query, pageSize, pageToken } = propsValue;

    const baseUrl = 'https://chat.googleapis.com/v1';
    const endpoint = `${baseUrl}/spaces/${spaceId}/messages`;

    const params = new URLSearchParams({
      filter: `text:"${query}"`,
      pageSize: pageSize?.toString() || '25',
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    const response = await fetch(`${endpoint}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to search messages: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  },
}); 