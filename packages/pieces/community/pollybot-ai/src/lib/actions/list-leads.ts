import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pollybotAuth } from '../auth';
import {
  baseUrl,
  leadStatusOptions,
  leadPriorityOptions,
  formatError,
} from '../common/common';

export const listLeads = createAction({
  name: 'list_leads',
  displayName: 'List Leads',
  description: 'Retrieves a list of leads with optional filtering.',
  audience: 'both',
  aiMetadata: {
    description:
      'List leads for the configured PollyBot chatbot. Supports pagination, search, and filtering.',
    idempotent: true,
  },
  auth: pollybotAuth,
  props: {
    page: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      defaultValue: 50,
      description: 'The maximum number of leads to return (max 100)',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: Object.entries(leadStatusOptions).map(([value, label]) => ({
          label,
          value,
        })),
      },
      description: 'Filter leads by their current pipeline status.',
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      options: {
        options: Object.entries(leadPriorityOptions).map(([value, label]) => ({
          label,
          value,
        })),
      },
      description: 'Filter leads by their assigned priority level.',
    }),
    search: Property.ShortText({
      displayName: 'Search',
      required: false,
      description:
        'Case-insensitive substring search matching name, email, or company.',
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      defaultValue: 'createdAt',
      options: {
        options: [
          { label: 'Created At', value: 'createdAt' },
          { label: 'Updated At', value: 'updatedAt' },
          { label: 'Name', value: 'name' },
          { label: 'Email', value: 'email' },
          { label: 'Status', value: 'status' },
          { label: 'Priority', value: 'priority' },
        ],
      },
      description: 'Field to sort the retrieved leads by.',
    }),
    sortOrder: Property.StaticDropdown({
      displayName: 'Sort Order',
      required: false,
      defaultValue: 'desc',
      options: {
        options: [
          { label: 'Descending', value: 'desc' },
          { label: 'Ascending', value: 'asc' },
        ],
      },
      description: 'Direction to sort results.',
    }),
  },
  async run({ auth, propsValue }) {
    const { page, limit, status, priority, search, sortBy, sortOrder } =
      propsValue;

    const queryParams: Record<string, string> = {
      page: (page ?? 1).toString(),
      limit: Math.min(limit ?? 50, 100).toString(),
    };

    if (status) queryParams['status'] = status;
    if (priority) queryParams['priority'] = priority;
    if (search) queryParams['search'] = search;
    if (sortBy) queryParams['sortBy'] = sortBy;
    if (sortOrder) queryParams['sortOrder'] = sortOrder;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/chatbots/${auth.props.chatbotId}/leads`,
        headers: {
          Authorization: `Bearer ${auth.props.apiKey}`,
        },
        queryParams: queryParams,
      });

      const data = response.body.data || response.body;
      return Array.isArray(data.leads) ? data.leads : [];
    } catch (e) {
      throw new Error(formatError(e));
    }
  },
});
