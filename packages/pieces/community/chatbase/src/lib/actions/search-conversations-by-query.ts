import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { chatbaseAuth } from '../../index';
import { chatbotIdDropdown } from '../common/props';

export const searchConversationsAction = createAction({
  auth: chatbaseAuth,
  name: 'search_conversations',
  displayName: 'Search Conversations by Query',
  description: 'Searches for conversations from a specific chatbot using optional filters like date range, sources, pagination.',
  props: {
    chatbotId: chatbotIdDropdown,
    filteredSources: Property.MultiSelectDropdown({
      displayName: 'Sources (Optional)',
      description: 'Filter by one or more conversation sources',
      required: false,
      options: async () => {
        return {
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
        };
      },
      refreshers: []
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date (Optional)',
      required: false,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date (Optional)',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page (Optional)',
      description: 'Pagination page number (default = 1)',
      required: false,
    }),
    size: Property.Number({
      displayName: 'Page Size (Optional)',
      description: 'Number of results per page (default = 10, max = 100)',
      required: false,
    }),
  },

  async run(context) {
    const {
      chatbotId,
      filteredSources,
      startDate,
      endDate,
      page,
      size,
    } = context.propsValue;

    const apiKey = context.auth as string;

    const queryParams = new URLSearchParams({ chatbotId });

    if (filteredSources?.length) {
      queryParams.append('filteredSources', filteredSources.join(','));
    }
    if (startDate) {
      queryParams.append('startDate', startDate.toString().split('T')[0]);
    }
    if (endDate) {
      queryParams.append('endDate', endDate.toString().split('T')[0]);
    }
    if (page) {
      queryParams.append('page', page.toString());
    }
    if (size) {
      queryParams.append('size', size.toString());
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/get-conversations?${queryParams.toString()}`
    );

    return response;
  },
});
