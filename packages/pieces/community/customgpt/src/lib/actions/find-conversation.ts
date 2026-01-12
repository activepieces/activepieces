import { createAction, Property } from '@activepieces/pieces-framework';
import { customgptAuth } from '../common/auth';
import { projectId } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findConversation = createAction({
  auth: customgptAuth,
  name: 'findConversation',
  displayName: 'Find Conversation',
  description:
    'List and search conversations for an agent with optional filtering',
  props: {
    project_id: projectId,
    name: Property.ShortText({
      displayName: 'Conversation Name',
      description: 'Filter conversations by name (optional)',
      required: false,
    }),

    userFilter: Property.StaticDropdown({
      displayName: 'User Filter',
      description: 'Filter by user who created the conversation (default: all)',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All Users', value: 'all' },
          { label: 'Anonymous Users', value: 'anonymous' },
          { label: 'Team Members', value: 'team_member' },
          { label: 'Me', value: 'me' },
        ],
      },
    }),
    lastUpdatedAfter: Property.DateTime({
      displayName: 'Last Updated After',
      description:
        'Only return conversations with messages after this date (optional) e.g. 2025-01-09T18:30:00Z',
      required: false,
    }),
  },
  async run(context) {
    const { project_id, name, userFilter, lastUpdatedAfter } =
      context.propsValue;

    // Build query parameters
    const queryParams: any = {};

    queryParams.order = 'desc';
    queryParams.orderBy = 'created_at';
    if (userFilter) queryParams.userFilter = userFilter;
    if (name) queryParams.name = name;
    if (lastUpdatedAfter) queryParams.lastUpdatedAfter = lastUpdatedAfter;

    // Build query string
    const queryString =
      Object.keys(queryParams).length > 0
        ? '?' + new URLSearchParams(queryParams).toString()
        : '';

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      `/projects/${project_id}/conversations${queryString}`
    );

    return response;
  },
});
