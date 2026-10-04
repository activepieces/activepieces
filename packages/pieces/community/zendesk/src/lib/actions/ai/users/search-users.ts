import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskSearchUsersOutputSchema } from '../../../output-schemas';

export const zendeskSearchUsers = createAction({
  auth: zendeskAuth,
  name: 'zendesk_search_users',
  outputSchema: zendeskSearchUsersOutputSchema,
  displayName: 'Search Users',
  description: 'Find users by email, name, phone or other attributes.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches users with Zendesk search syntax: a plain email or name, or terms like email:jane@acme.com, role:agent, organization:acme or tags:vip. Use External ID for an exact external ID match. Returns user IDs for Create Ticket, Update Ticket and the user actions.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Query', description: 'Search terms, e.g. jane@acme.com or role:agent name:Jane.', required: false }),
    external_id: Property.ShortText({ displayName: 'External ID', description: 'Exact external ID to match instead of a query.', required: false }),
    limit: zendeskAiProps.limit(),
    page: zendeskAiProps.page(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ users: unknown[]; next_page?: string | null }>({
      auth,
      method: HttpMethod.GET,
      path: `/users/search.json`,
      queryParams: {
        ...zendeskApi.offsetQuery({ limit: propsValue.limit, page: propsValue.page }),
        ...zendeskApi.query({ query: propsValue.query, external_id: propsValue.external_id }),
      },
    });
    return {
      users: response.users,
      count: response.users.length,
      ...zendeskApi.offsetResult({ nextPage: response.next_page, page: propsValue.page }),
    };
  },
});
