import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { makeRequest, Conversation } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findConversationAction = createAction({
  auth: codyAuth,
  name: 'find_conversation',
  displayName: 'Find Conversation',
  description: 'Finds conversation based on bot or name',
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      required: true,
      options: {
        options: [
          { label: 'By Bot ID', value: 'bot_id' },
          { label: 'By Conversation Name', value: 'name' },
          { label: 'By Conversation ID', value: 'id' },
        ],
      },
      defaultValue: 'bot_id',
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      required: true,
      description: 'The value to search for (Bot ID, Conversation Name, or Conversation ID)',
    }),
  },
  async run(context) {
    const { search_type, search_value } = context.propsValue;

    let endpoint = '/conversations';
    let queryParams = '';

    switch (search_type) {
      case 'bot_id':
        queryParams = `?bot_id=${encodeURIComponent(search_value)}`;
        break;
      case 'name':
        queryParams = `?name=${encodeURIComponent(search_value)}`;
        break;
      case 'id':
        endpoint = `/conversations/${search_value}`;
        break;
    }

    const response = await makeRequest<Conversation[] | Conversation>(
      HttpMethod.GET,
      endpoint + queryParams,
      context.auth
    );

    if (!response.success) {
      throw new Error(`Failed to find conversation: ${response.error}`);
    }

    const conversations = Array.isArray(response.data) ? response.data : [response.data];
    
    if (conversations.length === 0) {
      throw new Error(`No conversation found for ${search_type}: ${search_value}`);
    }

    return search_type === 'id' ? conversations[0] : conversations;
  },
});