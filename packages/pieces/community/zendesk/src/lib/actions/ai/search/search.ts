import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskSearchOutputSchema } from '../../../output-schemas';

export const zendeskSearch = createAction({
  auth: zendeskAuth,
  name: 'zendesk_search',
  outputSchema: zendeskSearchOutputSchema,
  displayName: 'Search',
  description: 'Search tickets, users and organizations with Zendesk search syntax.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches tickets, users and organizations with Zendesk search syntax, e.g. "type:ticket status<solved requester:jane@acme.com", "type:ticket tags:vip created>2026-01-01" or "type:organization name:Acme*". Always include type: to get one kind of record; each result has result_type. Returns at most 1000 results in total; narrow the query instead of paging deeper. The index lags writes by a few minutes, so use Get Ticket for a just-created record.',
    idempotent: true,
  },
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'Zendesk search query, e.g. type:ticket status:open assignee:me.',
      required: true,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Defaults to relevance.',
      required: false,
      options: {
        options: [
          { label: 'Updated at', value: 'updated_at' },
          { label: 'Created at', value: 'created_at' },
          { label: 'Priority', value: 'priority' },
          { label: 'Status', value: 'status' },
          { label: 'Ticket type', value: 'ticket_type' },
        ],
      },
    }),
    sort_order: zendeskAiProps.sortOrder(),
    limit: zendeskAiProps.limit(),
    page: zendeskAiProps.page(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ results: unknown[]; count: number; next_page?: string | null }>({
      auth,
      method: HttpMethod.GET,
      path: '/search.json',
      queryParams: {
        ...zendeskApi.offsetQuery({ limit: propsValue.limit, page: propsValue.page }),
        ...zendeskApi.query({
          query: propsValue.query,
          sort_by: propsValue.sort_by,
          sort_order: propsValue.sort_order,
        }),
      },
    });
    return {
      results: response.results,
      count: response.results.length,
      total_count: response.count,
      ...zendeskApi.offsetResult({ nextPage: response.next_page, page: propsValue.page }),
    };
  },
});
