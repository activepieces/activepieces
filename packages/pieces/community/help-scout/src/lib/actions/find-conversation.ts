import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../auth';
import { helpScoutCommon } from '../common/client';
import { Conversation } from '../common/types';

export const findConversation = createAction({
  auth: helpScoutAuth,
  name: 'find-conversation',
  displayName: 'Find Conversation',
  description: 'Searches for conversations by various criteria',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'What to search by',
      required: true,
      options: {
        options: [
          { label: 'Conversation ID', value: 'id' },
          { label: 'Subject', value: 'subject' },
          { label: 'Customer Email', value: 'customer_email' },
          { label: 'Tag', value: 'tag' },
          { label: 'Mailbox', value: 'mailbox' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'Value to search for',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status Filter',
      description: 'Filter by conversation status',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Closed', value: 'closed' },
          { label: 'Pending', value: 'pending' },
          { label: 'Spam', value: 'spam' },
        ],
      },
    }),
    assignedTo: helpScoutCommon.userDropdown,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return',
      required: false,
      defaultValue: 10,
    }),
    includeThreads: Property.Checkbox({
      displayName: 'Include Threads',
      description: 'Include conversation threads in the results',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      searchBy,
      searchValue,
      status,
      assignedTo,
      limit,
      includeThreads,
    } = context.propsValue;

    let conversations: Conversation[] = [];

    try {
      if (searchBy === 'id') {
        // Search by specific conversation ID
        const embed = includeThreads ? 'threads' : '';
        const conversation = await helpScoutCommon.makeRequest(
          context.auth,
          HttpMethod.GET,
          `/conversations/${searchValue}`,
          undefined,
          embed ? { embed } : undefined
        );
        conversations = [conversation];
      } else {
        // Search using query parameters
        const queryParams: any = {
          sortField: 'createdAt',
          sortOrder: 'desc',
        };

        if (status && status !== 'all') {
          queryParams.status = status;
        }

        if (assignedTo) {
          queryParams.assigned = assignedTo;
        }

        if (includeThreads) {
          queryParams.embed = 'threads';
        }

        switch (searchBy) {
          case 'subject':
            queryParams.query = `subject:"${searchValue}"`;
            break;
          case 'customer_email':
            queryParams.query = `customer.email:"${searchValue}"`;
            break;
          case 'tag':
            queryParams.tag = searchValue;
            break;
          case 'mailbox':
            queryParams.mailbox = searchValue;
            break;
        }

        const response = await helpScoutCommon.makeRequest(
          context.auth,
          HttpMethod.GET,
          '/conversations',
          undefined,
          queryParams
        );

        conversations = response._embedded.conversations || [];
      }

      // Apply limit if specified
      if (limit && conversations.length > limit) {
        conversations = conversations.slice(0, limit);
      }

      return {
        success: true,
        conversations,
        total: conversations.length,
      };
    } catch (error: any) {
      if (error.toString().includes('404')) {
        return {
          success: true,
          conversations: [],
          total: 0,
          message: 'No conversations found matching the criteria',
        };
      }
      throw new Error(`Failed to find conversations: ${error}`);
    }
  },
});