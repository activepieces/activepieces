import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pollybotAuth } from '../auth';
import { baseUrl, leadStatusOptions, formatError } from '../common/common';

export const listLeads = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'list_leads',
  displayName: 'List Leads',
  description: 'Retrieves a list of leads with filtering.',
  auth: pollybotAuth,
  props: {
    page: Property.Number({
        displayName: 'Page',
        required: false,
        defaultValue: 1
    }),
    limit: Property.Number({
        displayName: 'Limit',
        required: false,
        defaultValue: 10,
        description: 'Max 100'
    }),
    status: Property.StaticDropdown({
        displayName: 'Status',
        required: false,
        options: {
          options: Object.entries(leadStatusOptions).map(([value, label]) => ({ label, value })),
        },
    }),
    source: Property.ShortText({
        displayName: 'Source',
        required: false,
    }),
    search: Property.ShortText({
        displayName: 'Search',
        required: false,
        description: 'Search in name and email fields'
    })
  },
  async run({ auth, propsValue }) {
    const { page, limit, status, source, search } = propsValue;

    const queryParams: Record<string, string> = {
      page: (page ?? 1).toString(),
      limit: Math.min((limit ?? 10), 100).toString(),
    };

    if (status) queryParams['status'] = status;
    if (source) queryParams['source'] = source;
    if (search) queryParams['search'] = search;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/chatbots/${auth.props.chatbotId}/leads`,
        headers: {
          Authorization: `Bearer ${auth.props.apiKey}`,
        },
        queryParams: queryParams,
      });

      // Zapier logic returns just the leads array
      const data = response.body.data || response.body;
      return Array.isArray(data.leads) ? data.leads : [];
    } catch (e) {
      throw new Error(formatError(e));
    }
  },
});
