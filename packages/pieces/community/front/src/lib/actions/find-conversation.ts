import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

export const findConversation = createAction({
  auth: frontAuth,
  name: 'find_conversation',
  displayName: 'Find Conversation',
  description:
    'Find a conversation by search filters such as subject, participants, tags, inbox, etc.',
  props: {
    inbox_id: frontProps.channel({
      displayName: 'Inbox',
      description: 'The inbox to search in.',
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
      description: 'The statuses of the conversation.',
      required: false,
      options: {
        options: [
          { label: 'Assigned', value: 'assigned' },
          { label: 'Unassigned', value: 'unassigned' },
          { label: 'Archived', value: 'archived' },
          { label: 'Trashed', value: 'trashed' },
        ],
      },
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Search for text in the conversation subject.',
      required: false,
    }),
    custom_query: Property.ShortText({
      displayName: 'Custom Query',
      description:
        "Enter a custom search query. This will be combined with other filters. See Front's search syntax documentation for details.",
      required: false,
    }),
  },
  async run(context) {
    const { inbox_id, tags, assignee_id, statuses, subject, custom_query } =
      context.propsValue;
    const token = context.auth;
    const queryParts: string[] = [];

    if (inbox_id) queryParts.push(`inbox:${inbox_id}`);
    if (assignee_id) queryParts.push(`assignee:${assignee_id}`);
    if (subject) queryParts.push(subject);
    if (custom_query) queryParts.push(custom_query);
    if (tags) tags.forEach((tagId) => queryParts.push(`tag:${tagId}`));
    if (statuses) statuses.forEach((status) => queryParts.push(`is:${status}`));

    if (queryParts.length === 0) {
      throw new Error('At least one search filter must be provided.');
    }

    const query = queryParts.join(' ');
    const encodedQuery = encodeURIComponent(query);

    return await makeRequest(
      token,
      HttpMethod.GET,
      `/conversations/search/${encodedQuery}`
    );
  },
});
