import { createAction, Property } from '@activepieces/pieces-framework';
import { chatbaseAuth } from '../../index';

export const searchConversationsByQuery = createAction({
  auth: chatbaseAuth,
  name: 'searchConversationsByQuery',
  displayName: 'Search Conversations by Query',
  description: 'Retrieves conversations from a specific chatbot with various filters',
  props: {
    chatbotId: Property.ShortText({
      displayName: 'Chatbot ID',
      description: 'The ID of the target chatbot',
      required: true,
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start date for conversation range (YYYY-MM-DD)',
      required: false,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'End date for conversation range (YYYY-MM-DD)',
      required: false,
    }),
    filteredSources: Property.StaticMultiSelectDropdown({
      displayName: 'Filtered Sources',
      description: 'Sources to filter conversations by',
      required: false,
      options: {
        options: [
          { label: 'API', value: 'API' },
          { label: 'Chatbase site', value: 'Chatbase site' },
          { label: 'Instagram', value: 'Instagram' },
          { label: 'Messenger', value: 'Messenger' },
          { label: 'Slack', value: 'Slack' },
          { label: 'Unspecified', value: 'Unspecified' },
          { label: 'WhatsApp', value: 'WhatsApp' },
          { label: 'Widget or Iframe', value: 'Widget or Iframe' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (default: 1)',
      required: false,
      defaultValue: 1,
    }),
    size: Property.Number({
      displayName: 'Results per Page',
      description: 'Number of results per page (default: 10, max: 100)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams = new URLSearchParams({
      chatbotId: propsValue.chatbotId,
    });

    if (propsValue.startDate) {
      queryParams.append('startDate', propsValue.startDate.split('T')[0]);
    }
    if (propsValue.endDate) {
      queryParams.append('endDate', propsValue.endDate.split('T')[0]);
    }
    if (propsValue.filteredSources?.length) {
      queryParams.append('filteredSources', propsValue.filteredSources.join(','));
    }
    if (propsValue.page) {
      queryParams.append('page', propsValue.page.toString());
    }
    if (propsValue.size) {
      queryParams.append('size', propsValue.size.toString());
    }

    const response = await fetch(`https://www.chatbase.co/api/v1/get-conversations?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${auth.apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Invalid date format provided');
      }
      if (response.status === 401) {
        throw new Error('Unauthorized: Please check your API key');
      }
      if (response.status === 404) {
        throw new Error('Chatbot ID not found');
      }
      if (response.status === 500) {
        throw new Error('Internal server error occurred');
      }
      throw new Error(`Failed to fetch conversations: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  },
});
