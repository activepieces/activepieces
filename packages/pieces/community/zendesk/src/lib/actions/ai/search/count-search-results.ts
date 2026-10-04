import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskCountSearchResultsOutputSchema } from '../../../output-schemas';

export const zendeskCountSearchResults = createAction({
  auth: zendeskAuth,
  name: 'zendesk_count_search_results',
  outputSchema: zendeskCountSearchResultsOutputSchema,
  displayName: 'Count Search Results',
  description: 'Count the records matching a search query.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns how many tickets, users or organizations match a Zendesk search query, using the same syntax as Search (e.g. "type:ticket status:open"). Use it to size a result before paging through Search.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Query', description: 'Zendesk search query, e.g. type:ticket status:open tags:vip.', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ count: number }>({
      auth,
      method: HttpMethod.GET,
      path: `/search/count.json`,
      queryParams: zendeskApi.query({ query: propsValue.query }),
    });
    return { count: response.count };
  },
});
