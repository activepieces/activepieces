import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makePaginatedRequest } from '../common/client';
import { frontProps } from '../common/props';

export const findConversation = createAction({
  auth: frontAuth,
  name: 'find_conversation',
  displayName: 'Find Conversation',
  description: 'Find a conversation by searching with various filters.',
  props: {
    query: Property.ShortText({
      displayName: 'Plain Text Search',
      description: 'Search for text in the conversation subject and body.',
      required: false,
    }),
    inbox_id: frontProps.inbox({
      displayName: 'Inbox',
      description: 'Filter conversations by a specific inbox.',
      required: false,
    }),
    tags: frontProps.tags({
      displayName: 'Tags',
      description: 'Conversations must have all of these tags.',
      required: false,
    }),
    assignee_id: frontProps.teammate({
      displayName: 'Assignee',
      description: 'The teammate assigned to the conversation.',
      required: false,
    }),
    statuses: Property.StaticMultiSelectDropdown({
      displayName: 'Statuses',
      description: 'Filter by conversation status.',
      required: false,
      options: {
        options: [
          { label: 'Assigned', value: 'assigned' },
          { label: 'Unassigned', value: 'unassigned' },
          { label: 'Open', value: 'open' },
          { label: 'Archived', value: 'archived' },
          { label: 'Trashed', value: 'trashed' },
          { label: 'Snoozed', value: 'snoozed' },
        ],
      },
    }),
    from: Property.ShortText({
      displayName: 'From (Email)',
      description: "Filter by the sender's email address.",
      required: false,
    }),
    to: Property.ShortText({
      displayName: 'To (Email)',
      description: "Filter by the recipient's email address.",
      required: false,
    }),
    custom_query: Property.ShortText({
      displayName: 'Custom Query',
      description: "Enter a custom search query using Front's syntax.",
      required: false,
    }),
  },
  async run(context) {
    const {
      query,
      inbox_id,
      tags,
      assignee_id,
      statuses,
      from,
      to,
      custom_query,
    } = context.propsValue;
    const token = context.auth;
    const queryParts: string[] = [];

    if (query) queryParts.push(query);
    if (
      inbox_id &&
      typeof inbox_id === 'string' &&
      inbox_id.startsWith('inb_')
    ) {
      queryParts.push(`inbox_id:${inbox_id}`);
    }
    if (assignee_id) queryParts.push(`assignee_id:${assignee_id}`);
    if (from) queryParts.push(`from:${from}`);
    if (to) queryParts.push(`to:${to}`);
    if (custom_query) queryParts.push(custom_query);
    if (tags) tags.forEach((tagId) => queryParts.push(`tag_id:${tagId}`));
    if (statuses) statuses.forEach((status) => queryParts.push(`is:${status}`));

    const queryString = queryParts.join(' ');
    if (queryString.length === 0) {
      throw new Error('At least one search filter must be provided.');
    }

    const encodedQuery = encodeURIComponent(queryString);
    const fullUrl = `/conversations/search/${encodedQuery}`;

    return await makePaginatedRequest(token, fullUrl);
  },
});
