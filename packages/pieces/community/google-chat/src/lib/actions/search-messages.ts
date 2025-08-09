import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { googleChatAuth } from '../common/auth';

export const searchMessages = createAction({
  auth: googleChatAuth,
  name: 'searchMessages',
  displayName: 'Search Messages',
  description: 'Search within Chat for messages matching keywords or filters',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Keywords to search for in messages',
      required: true,
    }),
    space: Property.ShortText({
      displayName: 'Space Name',
      description: 'Optional space resource name (e.g., spaces/SPACE_ID) to limit search to specific space',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Maximum number of messages to return (1-100)',
      required: false,
      defaultValue: 25,
    }),
    orderBy: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'How to order the search results',
      required: false,
      defaultValue: 'create_time desc',
      options: {
        options: [
          { label: 'Newest First', value: 'create_time desc' },
          { label: 'Oldest First', value: 'create_time asc' },
        ],
      },
    }),
  },
  async run(context) {
    const { query, space, pageSize, orderBy } = context.propsValue;
    
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const chat = google.chat({ version: 'v1', auth: authClient });

    // Construct search parameters
    const searchParams: any = {
      query: query,
    };

    if (pageSize) {
      searchParams.pageSize = Math.min(Math.max(pageSize, 1), 100);
    }

    if (orderBy) {
      searchParams.orderBy = orderBy;
    }

    // If space is specified, add it to the query
    if (space) {
      let spaceName = space;
      if (!space.startsWith('spaces/')) {
        spaceName = `spaces/${space}`;
      }
      searchParams.query = `${query} space:${spaceName}`;
    }

    const response = await chat.spaces.messages.list({
      parent: space || 'spaces/-', // Use spaces/- to search across all spaces if no specific space
      filter: searchParams.query,
      pageSize: searchParams.pageSize,
      orderBy: searchParams.orderBy,
    });

    return {
      messages: response.data.messages || [],
      nextPageToken: response.data.nextPageToken,
      totalSize: response.data.messages?.length || 0,
    };
  },
});